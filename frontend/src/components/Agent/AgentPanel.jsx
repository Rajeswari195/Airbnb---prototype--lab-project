import { useEffect, useMemo, useState } from "react";
import "./Agent.css";
import { travelerApi } from "../../services/api";

/**
 * Props:
 *  - open: boolean
 *  - onClose: fn
 *  - defaults?: { location, startDate, endDate, guests }
 */
export default function AgentPanel({ open, onClose, defaults = {} }) {
  const AGENT_BASE =
    process.env.REACT_APP_AGENT_BASE ||
    window.__AGENT_BASE ||
    "http://localhost:8500";

  // form state
  const [location, setLocation] = useState(defaults.location || "");
  const [start, setStart] = useState(trimDate(defaults.startDate));
  const [end, setEnd] = useState(trimDate(defaults.endDate));
  const [adults, setAdults] = useState(String(defaults.guests || 2));
  const [kids, setKids] = useState("0");
  const [partyType, setPartyType] = useState("couple");
  const [budget, setBudget] = useState("moderate");
  const [interests, setInterests] = useState("parks, coffee");
  const [dietary, setDietary] = useState("");
  const [mobility, setMobility] = useState("");
  const [notes, setNotes] = useState("");
  const [freeText, setFreeText] = useState("");
  const [includeWeather, setIncludeWeather] = useState(true);

  // results
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(null);

  // reset from defaults when panel opens
  useEffect(() => {
    if (open) {
      setLocation(defaults.location || "");
      setStart(trimDate(defaults.startDate));
      setEnd(trimDate(defaults.endDate));
      if (defaults.guests) setAdults(String(defaults.guests));
      setErr("");
    }
  }, [open, defaults]);

  // auto-fill from traveler's upcoming accepted booking
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const all = await travelerApi.listBookings();
        if (!Array.isArray(all) || !all.length) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureAccepted = all.filter((b) => {
          if (b.status !== "Accepted" || !b.startDate) return false;
          const d = new Date(b.startDate);
          d.setHours(0, 0, 0, 0);
          return d >= today;
        });

        if (!futureAccepted.length) return;

        futureAccepted.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        );
        const next = futureAccepted[0];

        setLocation(
          (prev) =>
            next.city || next.title || prev || defaults.location || ""
        );
        if (next.startDate) setStart(trimDate(next.startDate));
        if (next.endDate) setEnd(trimDate(next.endDate));
        if (next.guests != null) setAdults(String(next.guests));
      } catch (e) {
        console.warn(
          "Failed to prefill AI agent from upcoming booking",
          e
        );
      }
    })();
  }, [open, defaults.location]);

  const uiDateLine = useMemo(() => {
    const s = trimDate(start);
    const e = trimDate(end);
    if (!s && !e) return "— → —";
    return `${s || "—"} → ${e || "—"}`;
  }, [start, end]);

  async function generate() {
    setErr("");
    setPlan(null);

    if (!location || !start || !end) {
      setErr("Please provide location, start and end dates.");
      return;
    }
    if (new Date(end) < new Date(start)) {
      setErr("End date must be on/after start date.");
      return;
    }

    const payload = {
      booking: {
        location: location.trim(),
        startDate: start,
        endDate: end,
        party: {
          adults: Number(adults || 2),
          kids: Number(kids || 0),
          type: partyType,
        },
        budgetTier: budget,
      },
      preferences: {
        interests: splitCSV(interests),
        dietary: splitCSV(dietary),
        mobility: mobility || undefined,
        notes: notes || undefined,
      },
      freeText: freeText || undefined,
      includeWeather,
    };

    setLoading(true);
    try {
      const res = await fetch(`${AGENT_BASE}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Agent error ${res.status}${text ? `: ${text}` : ""}`);
      }
      const data = await res.json();
      setPlan(data);

      requestAnimationFrame(() => {
        const root = document.querySelector(".agent-panel .agent-body");
        if (root) root.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (e) {
      setErr(e.message || "Failed to get plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`agent-panel ${open ? "open" : ""}`}>
      <div className="agent-header">
        <div>
          <div className="agent-title">Trip Plan</div>
          <div className="agent-sub text-muted small">
            Using:{" "}
            <span className="fw-semibold">
              {location || "(no upcoming trip found)"}
            </span>{" "}
            · Dates: <span className="fw-semibold">{uiDateLine}</span>
          </div>
        </div>
        <button className="btn btn-light" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Scrollable content */}
      <div className="agent-body">
        {/* Form */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Location</label>
                <input
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State/Country"
                />
              </div>

              <div className="col-6">
                <label className="form-label">Start</label>
                <input
                  type="date"
                  className="form-control"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label">End</label>
                <input
                  type="date"
                  className="form-control"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>

              <div className="col-4">
                <label className="form-label">Adults</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label">Kids</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={kids}
                  onChange={(e) => setKids(e.target.value)}
                />
              </div>
              <div className="col-4">
                <label className="form-label">Party</label>
                <select
                  className="form-select"
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                >
                  <option value="family">family</option>
                  <option value="couple">couple</option>
                  <option value="friends">friends</option>
                  <option value="solo">solo</option>
                </select>
              </div>

              <div className="col-6">
                <label className="form-label">Budget</label>
                <select
                  className="form-select"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="budget">budget</option>
                  <option value="moderate">moderate</option>
                  <option value="premium">premium</option>
                  <option value="luxury">luxury</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Mobility</label>
                <input
                  className="form-control"
                  placeholder="e.g., stroller-friendly"
                  value={mobility}
                  onChange={(e) => setMobility(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">
                  Interests{" "}
                  <span className="text-muted">(comma-separated)</span>
                </label>
                <input
                  className="form-control"
                  placeholder="parks, museums, coffee"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">
                  Dietary{" "}
                  <span className="text-muted">(comma-separated)</span>
                </label>
                <input
                  className="form-control"
                  placeholder="vegan, nut free, halal, kosher"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  placeholder="no long hikes, needs stroller access"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Free text ask</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g., plan a two-day kid-friendly itinerary with vegan food"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                />
              </div>

              <div className="col-12 d-flex align-items-center">
                <input
                  id="incw"
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={includeWeather}
                  onChange={(e) => setIncludeWeather(e.target.checked)}
                />
                <label htmlFor="incw" className="form-check-label">
                  Include weather
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {plan && (
          <>
            <div className="text-muted small mb-2">
              Source:{" "}
              <span className="fw-semibold">
                {plan.source || "fallback"}
              </span>
            </div>

            <h5 className="mb-2">Itinerary</h5>
            {plan.itinerary?.map((d, i) => (
              <div key={i} className="card mb-2">
                <div className="card-body">
                  <div className="fw-semibold fs-6">{d.date}</div>
                  <div className="mt-1">Morning: {d.morning}</div>
                  <div>Afternoon: {d.afternoon}</div>
                  <div>Evening: {d.evening}</div>
                </div>
              </div>
            ))}

            <h5 className="mt-4 mb-2">Activities</h5>
            {plan.activities?.map((a, i) => (
              <div key={i} className="card mb-2">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div className="fw-semibold">{a.title}</div>
                    {a.when && (
                      <span className="badge bg-light text-dark">
                        {a.when}
                      </span>
                    )}
                  </div>
                  <div className="text-muted small">
                    {a.address}
                    {a.geo ? (
                      <>
                        {" "}
                        · ({Number(a.geo.lat).toFixed(3)},{" "}
                        {Number(a.geo.lon).toFixed(3)})
                      </>
                    ) : null}
                  </div>
                  <div className="small mt-2">
                    <span className="badge bg-light text-dark me-1">
                      {a.priceTier || "—"}
                    </span>
                    {a.durationMins != null && (
                      <span className="badge bg-light text-dark me-1">
                        {a.durationMins} mins
                      </span>
                    )}
                    {Array.isArray(a.tags) &&
                      a.tags.map((t, j) => (
                        <span
                          key={j}
                          className="badge bg-secondary me-1"
                        >
                          {t}
                        </span>
                      ))}
                    {a.wheelchairFriendly && (
                      <span className="badge bg-success me-1">
                        wheelchair
                      </span>
                    )}
                    {a.childFriendly && (
                      <span className="badge bg-success">
                        kids
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <h5 className="mt-4 mb-2">Restaurants</h5>
            {plan.restaurants?.map((r, i) => (
              <div key={i} className="card mb-2">
                <div className="card-body">
                  <div className="fw-semibold">{r.name}</div>
                  <div className="text-muted small">{r.address}</div>
                  <div className="small mt-1">
                    {r.dietTags?.length
                      ? r.dietTags.join(", ")
                      : "dietary: —"}{" "}
                    · {r.priceTier || "—"}
                    {r.url && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          link
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <h5 className="mt-4 mb-2">Packing Checklist</h5>
            {plan.packingList?.map((p, i) => (
              <div key={i} className="card mb-2">
                <div className="card-body">{p}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Sticky footer action bar */}
      <div className="agent-actions">
        <button
          className="btn btn-primary w-100"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate plan"}
        </button>
        {err && (
          <div className="alert alert-danger mt-2 mb-0">{err}</div>
        )}
      </div>
    </div>
  );
}

function splitCSV(s) {
  return (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function trimDate(value) {
  if (!value) return "";
  const s = String(value);
  return s.slice(0, 10);
}
