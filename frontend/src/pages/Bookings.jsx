// /frontend/src/pages/Bookings.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setStatusFilter,
  fetchBookings,
} from "../features/bookings/bookingsSlice";

const TABS = ["All", "Pending", "Accepted", "Cancelled"];

export default function Bookings() {
  const dispatch = useDispatch();
  const { statusFilter, items, loading, error } = useSelector(
    (state) => state.bookings
  );

  useEffect(() => {
    dispatch(fetchBookings(statusFilter));
  }, [statusFilter, dispatch]);

  return (
    <div className="container py-4">
      <h3 className="mb-3">Your trips</h3>

      <div className="btn-group mb-3" role="group">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`btn btn-sm ${
              statusFilter === t ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => dispatch(setStatusFilter(t))}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && <div>Loading…</div>}

      {!loading && items.length === 0 && !error && (
        <div className="text-muted">No bookings to show.</div>
      )}

      <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
        {items.map((b) => (
          <div key={b.id} className="col">
            <Link
              to={`/bookings/${b.id}`}
              className="text-decoration-none text-reset"
            >
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
                    <span
                      className={`badge text-bg-${badgeVariant(b.status)}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="small text-muted text-truncate">
                    {b.city}
                  </div>
                  <div className="small mt-1">
                    {b.startDate?.slice(0, 10)} → {b.endDate?.slice(0, 10)} ·{" "}
                    {b.guests} guest{b.guests > 1 ? "s" : ""}
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
