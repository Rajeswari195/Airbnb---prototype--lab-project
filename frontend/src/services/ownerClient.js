const OWNER_API = process.env.REACT_APP_OWNER_API || "http://localhost:8001";

async function request(path, opts = {}) {
  const res = await fetch(`${OWNER_API}${path}`, {
    method: opts.method || "GET",
    headers: { ...(opts.headers || {}) },
    body: opts.body,
    credentials: "include",
  });
  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json().catch(() => null) : await res.text().catch(() => "");
  if (!res.ok) {
    const msg = (isJSON && data && (data.error || data.message)) || res.statusText || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export const ownerClient = {
  exchange: (token) =>
    request("/api/auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),

  dashboard: () => request("/api/dashboard"),

  listProps: () => request("/api/properties"),
  getProp: (id) => request(`/api/properties/${id}`),
  createProp: (payload) =>
    request("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateProp: (id, payload) =>
    request(`/api/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  uploadPhoto: async (id, file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${OWNER_API}/api/properties/${id}/photos`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) throw new Error((await res.text()) || "Upload failed");
    return res.json();
  },

  incoming: () => request("/api/bookings/incoming"),
  accept: (id) => request(`/api/bookings/${id}/accept`, { method: "POST" }),
  cancel: (id) => request(`/api/bookings/${id}/cancel`, { method: "POST" }),
};
