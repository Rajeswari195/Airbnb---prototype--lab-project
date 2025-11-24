// frontend/src/services/api.js
const TRAVELER_API = process.env.REACT_APP_TRAVELER_API;
const OWNER_API = process.env.REACT_APP_OWNER_API;

async function request(base, path, opts = {}) {
  // allow404 is used for endpoints where "not found" is not a fatal error
  const { allow404, ...fetchOpts } = opts;

  const res = await fetch(`${base}${path}`, {
    method: fetchOpts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(fetchOpts.headers || {}),
    },
    body: fetchOpts.body,
    credentials: "include",
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    // Special case: allow a 404 to be treated as "no data" when requested
    if (allow404 && res.status === 404) {
      return null;
    }

    const msg =
      (isJSON && data && (data.error || data.message)) ||
      res.statusText ||
      "Request failed";
    throw new Error(msg);
  }

  return data;
}

export const travelerApi = {
  signup: (body) =>
    request(TRAVELER_API, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body) =>
    request(TRAVELER_API, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    request(TRAVELER_API, "/api/auth/logout", {
      method: "POST",
    }),

  sessionToken: () =>
    request(TRAVELER_API, "/api/auth/session-token", {
      method: "POST",
    }),

  // ✅ Treat 404 as "no profile yet" so Navbar still considers the user authed
  me: () =>
    request(TRAVELER_API, "/api/users/me", {
      allow404: true,
    }),

  updateMe: (body) =>
    request(TRAVELER_API, "/api/users/me", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${TRAVELER_API}/api/users/me/avatar`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    const data = isJSON
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");
    if (!res.ok) {
      const msg =
        (isJSON && data && (data.error || data.message)) ||
        res.statusText ||
        "Upload failed";
      throw new Error(msg);
    }
    return data;
  },

  listings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(
      TRAVELER_API,
      `/api/properties${qs ? `?${qs}` : ""}`
    );
  },

  property: (id) => request(TRAVELER_API, `/api/properties/${id}`),
  getProperty: (id) => request(TRAVELER_API, `/api/properties/${id}`),

  getFavorites: () => request(TRAVELER_API, "/api/favorites"),
  addFavorite: (propertyId) =>
    request(TRAVELER_API, "/api/favorites", {
      method: "POST",
      body: JSON.stringify({ propertyId }),
    }),
  removeFavorite: (favoriteId) =>
    request(TRAVELER_API, `/api/favorites/${favoriteId}`, {
      method: "DELETE",
    }),

  createBooking: (body) =>
    request(TRAVELER_API, "/api/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(
      TRAVELER_API,
      `/api/bookings${qs ? `?${qs}` : ""}`
    );
  },

  updateBooking: (id, body) =>
    request(TRAVELER_API, `/api/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  cancelBooking: (id) =>
    request(TRAVELER_API, `/api/bookings/${id}/cancel`, {
      method: "POST",
    }),
};

export const ownerApi = {
  exchange: (token) =>
    request(OWNER_API, "/api/auth/exchange", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  enableHost: () =>
    request(OWNER_API, "/api/host/enable", {
      method: "POST",
    }),

  dashboard: () => request(OWNER_API, "/api/dashboard"),

  listings: () => request(OWNER_API, "/api/properties"),
  getListing: (id) => request(OWNER_API, `/api/properties/${id}`),
  createListing: (body) =>
    request(OWNER_API, "/api/properties", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateListing: (id, body) =>
    request(OWNER_API, `/api/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  uploadPhoto: async (id, file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${OWNER_API}/api/properties/${id}/photos`,
      {
        method: "POST",
        body: form,
        credentials: "include",
      }
    );
    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    const data = isJSON
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");
    if (!res.ok) {
      const msg =
        (isJSON && data && (data.error || data.message)) ||
        res.statusText ||
        "Upload failed";
      throw new Error(msg);
    }
    return data;
  },

  incomingRequests: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(OWNER_API, `/api/bookings/incoming${qs}`);
  },

  acceptBooking: (id) =>
    request(OWNER_API, `/api/bookings/${id}/accept`, {
      method: "POST",
    }),

  cancelBooking: (id) =>
    request(OWNER_API, `/api/bookings/${id}/cancel`, {
      method: "POST",
    }),
};
