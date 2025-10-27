const BASE = process.env.REACT_APP_AGENT_BASE || "http://localhost:8500";

export async function planTrip(payload) {
  const res = await fetch(`${BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Agent error ${res.status}`);
  return res.json();
}
