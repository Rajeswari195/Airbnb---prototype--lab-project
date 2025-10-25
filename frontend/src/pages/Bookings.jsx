import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { travelerApi } from "../services/api";

const TABS = ["All", "Pending", "Accepted", "Cancelled"];

export default function Bookings() {
  const [status, setStatus] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const params = {};
      if (status !== "All") params.status = status;
      const rows = await travelerApi.listBookings(params);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setErr(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div className="container py-4">
      <h3 className="mb-3">Your trips</h3>

      <div className="btn-group mb-3" role="group">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`btn btn-sm ${status === t ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setStatus(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {loading && <div>Loading…</div>}

      {!loading && items.length === 0 && !err && (
        <div className="text-muted">No bookings to show.</div>
      )}

      <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
        {items.map((b) => (
          <div key={b.id} className="col">
            <Link to={`/bookings/${b.id}`} className="text-decoration-none text-reset">
              <div className="card h-100 shadow-sm">
                <div
                  style={{
                    position: "relative",
                    paddingTop: "66.66%",
                    background: "#f7f7f7",
                  }}
                />
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="mb-0 text-truncate">{b.title}</h6>
                    <span className={`badge text-bg-${badgeVariant(b.status)}`}>{b.status}</span>
                  </div>
                  <div className="small text-muted text-truncate">{b.city}</div>
                  <div className="small mt-1">
                    {b.startDate?.slice(0, 10)} → {b.endDate?.slice(0, 10)} · {b.guests}{" "}
                    guest{b.guests > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
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
