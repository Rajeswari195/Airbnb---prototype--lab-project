import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { travelerApi } from "../services/api";

const TABS = ["All", "Pending", "Accepted", "Cancelled"];

export default function Bookings() {
  const [status, setStatus] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Allow /bookings?tab=pending etc.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      const normalized =
        tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase();
      if (TABS.includes(normalized)) {
        setStatus(normalized);
      }
    }
  }, [location.search]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await travelerApi.listBookings();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered =
    status === "All"
      ? items
      : items.filter((b) => b.status === status);

  function onTabClick(tab) {
    setStatus(tab);
    const qs = tab === "All" ? "" : `?tab=${tab.toLowerCase()}`;
    navigate(`/bookings${qs}`, { replace: true });
  }

  return (
    <div className="container py-4">
      <h3 className="mb-3">Trips</h3>

      <ul className="nav nav-tabs mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={
                "nav-link" + (tab === status ? " active" : "")
              }
              onClick={() => onTabClick(tab)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading && <div>Loading…</div>}

      {!loading && !filtered.length && !err && (
        <div className="text-muted">No trips yet.</div>
      )}

      <div className="row g-3">
        {filtered.map((b) => {
          const start = b.startDate ? String(b.startDate).slice(0, 10) : "";
          const end = b.endDate ? String(b.endDate).slice(0, 10) : "";
          const nights =
            start && end
              ? Math.max(
                  0,
                  (new Date(end) - new Date(start)) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;

          return (
            <div className="col-12" key={b.id}>
              <Link
                to={`/bookings/${b.id}`}
                className="card shadow-sm text-decoration-none text-reset"
              >
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <div className="fw-semibold">{b.title}</div>
                    <div className="small text-muted">{b.city}</div>
                    <div className="small mt-1">
                      {start} → {end} · {b.guests} guest
                      {b.guests > 1 ? "s" : ""}{" "}
                      {nights
                        ? `· ${nights} night${
                            nights !== 1 ? "s" : ""
                          }`
                        : ""}
                    </div>
                  </div>
                  <div className="text-end">
                    <span
                      className={`badge text-bg-${badgeVariant(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                    {b.price != null && (
                      <div className="small mt-2">
                        ${Number(b.price)} / night
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function badgeVariant(status) {
  switch (status) {
    case "Accepted":
      return "success";
    case "Pending":
      return "secondary";
    case "Cancelled":
      return "danger";
    default:
      return "secondary";
  }
}
