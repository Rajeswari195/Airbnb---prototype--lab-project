const BASE = "http://18.212.21.198:8500";

export async function planTrip(payload) {
  const res = await fetch(`${BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Agent error ${res.status}`);
  return res.json();
}
