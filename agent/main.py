import os
import json
from typing import List, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import google.generativeai as genai
from tavily import TavilyClient

# -----------------------------
# Load .env from THIS folder
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

print("DEBUG: loading .env from", ENV_PATH, "exists =", ENV_PATH.exists())
load_dotenv(dotenv_path=ENV_PATH, override=True)

AGENT_PORT = int(os.getenv("AGENT_PORT", "8500"))
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME") or "gemini-2.5-pro"
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

print("DEBUG: MODEL_NAME =", MODEL_NAME)
print("DEBUG: GEMINI_API_KEY present? ", bool(GEMINI_API_KEY))
print("DEBUG: TAVILY_API_KEY present?", bool(TAVILY_API_KEY))

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in .env")
if not TAVILY_API_KEY:
    raise RuntimeError("TAVILY_API_KEY is not set in .env")

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel(MODEL_NAME)
tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

# -----------------------------
# FastAPI app + CORS
# -----------------------------
app = FastAPI(title="AI Concierge Agent")

cors_origins = [o.strip() for o in CORS_ORIGINS_RAW.split(",") if o.strip()]
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health")
async def health():
    return {
        "service": "agent",
        "status": "ok",
        "time": datetime.utcnow().isoformat() + "Z",
    }


# -----------------------------
# Schemas
# -----------------------------
class Party(BaseModel):
    adults: int = Field(..., ge=1)
    kids: int = Field(0, ge=0)
    type: str = Field(..., description="family | couple | friends | solo")


class BookingContext(BaseModel):
    location: str
    startDate: str
    endDate: str
    party: Party
    budgetTier: str = Field(..., description="budget | moderate | premium | luxury")


class Preferences(BaseModel):
    interests: List[str] = Field(default_factory=list)
    dietary: List[str] = Field(default_factory=list)
    mobility: Optional[str] = None
    notes: Optional[str] = None


class PlanRequest(BaseModel):
    booking: BookingContext
    preferences: Preferences
    freeText: Optional[str] = None
    includeWeather: bool = True


class ItineraryDay(BaseModel):
    date: str
    morning: str
    afternoon: str
    evening: str


class Geo(BaseModel):
    lat: float
    lon: float


class ActivityCard(BaseModel):
    title: str
    address: Optional[str] = None
    geo: Optional[Geo] = None
    priceTier: Optional[str] = None
    durationMins: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    wheelchairFriendly: bool = False
    childFriendly: bool = False
    when: Optional[str] = None


class Restaurant(BaseModel):
    name: str
    address: Optional[str] = None
    dietTags: List[str] = Field(default_factory=list)
    priceTier: Optional[str] = None
    url: Optional[str] = None


class PlanResponse(BaseModel):
    source: str = "gemini+tavily"
    itinerary: List[ItineraryDay]
    activities: List[ActivityCard]
    restaurants: List[Restaurant]
    packingList: List[str]


# -----------------------------
# Helpers
# -----------------------------
def strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return text


def build_tavily_context(req: PlanRequest) -> str:
    loc = req.booking.location
    start = req.booking.startDate
    end = req.booking.endDate
    party = req.booking.party.type
    diet = ", ".join(req.preferences.dietary) or "no special diet"
    interests = ", ".join(req.preferences.interests) or "general sightseeing"

    poi_query = (
        f"Best things to do in {loc} for a {party} trip between {start} and {end}, "
        f"focused on {interests}. Include family-friendly options if applicable."
    )
    poi_ctx = tavily_client.get_search_context(query=poi_query)

    rest_query = (
        f"Good restaurants in {loc} suitable for: {diet}. "
        f"Include cuisines, approximate price tier and whether they support dietary needs."
    )
    rest_ctx = tavily_client.get_search_context(query=rest_query)

    events_query = f"Notable local events in {loc} around {start} to {end}."
    events_ctx = tavily_client.get_search_context(query=events_query)

    combined = (
        "=== POINTS OF INTEREST & ACTIVITIES ===\n"
        + poi_ctx
        + "\n\n=== RESTAURANTS ===\n"
        + rest_ctx
        + "\n\n=== LOCAL EVENTS ===\n"
        + events_ctx
    )

    if req.includeWeather:
        weather_query = (
            f"Typical weather and packing tips for {loc} between {start} and {end}. "
            f"Include temperature range, rain probability and clothing suggestions."
        )
        weather_ctx = tavily_client.get_search_context(query=weather_query)
        combined += "\n\n=== WEATHER & PACKING HINTS ===\n" + weather_ctx

    return combined[:20000]


# -----------------------------
# /plan endpoint
# -----------------------------
@app.post("/plan", response_model=PlanResponse)
def make_plan(req: PlanRequest):
    try:
        web_context = build_tavily_context(req)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Tavily error: {e}")

    system_instructions = """
You are an AI travel concierge for an Airbnb-style platform.

Given:
- A booking (dates, location, party, budget)
- Traveler preferences (interests, dietary, mobility, notes)
- Web search context (POIs, restaurants, events, weather via Tavily)

You MUST return a SINGLE JSON object with this exact structure:

{
  "source": "gemini+tavily",
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "morning": "string",
      "afternoon": "string",
      "evening": "string"
    }
  ],
  "activities": [
    {
      "title": "string",
      "address": "string or null",
      "geo": {"lat": float, "lon": float} or null,
      "priceTier": "budget|moderate|premium|luxury or null",
      "durationMins": int or null,
      "tags": ["string", ...],
      "wheelchairFriendly": true/false,
      "childFriendly": true/false,
      "when": "morning|afternoon|evening or null"
    }
  ],
  "restaurants": [
    {
      "name": "string",
      "address": "string or null",
      "dietTags": ["string", ...],
      "priceTier": "budget|moderate|premium|luxury or null",
      "url": "string or null"
    }
  ],
  "packingList": ["string", ...]
}

Requirements:
- Honor dietary filters for restaurant suggestions.
- Mark activities as wheelchair/child friendly when appropriate.
- Use the provided web context to pick realistic local POIs, events and restaurants.
- Cover each day from startDate to endDate inclusive.
- Do NOT include any explanation outside JSON. Return JSON only.
"""

    booking_json = req.booking.model_dump()
    prefs_json = req.preferences.model_dump()

    user_prompt = f"""
BOOKING (JSON):
{json.dumps(booking_json, indent=2)}

PREFERENCES (JSON):
{json.dumps(prefs_json, indent=2)}

USER FREE TEXT (may be null):
{req.freeText or "None"}

WEB CONTEXT (Tavily):
{web_context}
"""

    try:
        response = gemini_model.generate_content(
            [system_instructions, "\n\n", user_prompt]
        )
        raw = response.text or ""
        cleaned = strip_code_fences(raw)
        parsed = json.loads(cleaned)
        return PlanResponse(**parsed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=AGENT_PORT,
        reload=True,
    )
