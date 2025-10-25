import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { travelerApi } from "../services/api";

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [b, setB] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const all = await travelerApi.listBookings();
      const found = Array.isArray(all) ? all.find((x) => String(x.id) === String(id)) : null;
      if (!found) {
        setErr("Not Found");
      }
      setB(found || null);
    } catch (e) {
      setErr(e.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function onCancel() {
    if (!b) return;
    const ok = window.confirm("Cancel this booking request?");
    if (!ok) return;

    try {
      setCancelling(true);
      await travelerApi.cancelBooking(b.id);
      alert("Booking cancelled.");
      navigate("/bookings");
    } catch (e) {
      alert(e.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="container py-4">Loading…</div>;
  if (err && !b) return <div className="container py-4">{err}</div>;
  if (!b) return null;

  const dates = `${b.startDate?.slice(0, 10)} → ${b.endDate?.slice(0, 10)}`;
  const guests = `${b.guests} guest${b.guests > 1 ? "s" : ""}`;
  const canCancel = b.status === "Pending";

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Booking details</h3>
        <Link to="/bookings" className="btn btn-outline-secondary btn-sm">Back to trips</Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{b.title}</h5>
                <span className={`badge text-bg-${badgeVariant(b.status)}`}>{b.status}</span>
              </div>

              <div className="text-muted mt-1">{b.city}</div>
              <hr />

              <div className="row">
                <div className="col-sm-6 mb-2">
                  <div className="fw-semibold small text-uppercase text-muted">Dates</div>
                  <div>{dates}</div>
                </div>
                <div className="col-sm-6 mb-2">
                  <div className="fw-semibold small text-uppercase text-muted">Guests</div>
                  <div>{guests}</div>
                </div>
              </div>

              {canCancel && (
                <button
                  className="btn btn-outline-danger mt-3"
                  onClick={onCancel}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling…" : "Cancel booking"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div style={{ position: "relative", paddingTop: "56%", background: "#f7f7f7" }} />
            <div className="card-body">
              <div className="fw-semibold mb-1">{b.title}</div>
              <div className="small text-muted">{b.city}</div>
              {b.price != null && (
                <div className="mt-2">
                  <span className="fw-semibold">${Number(b.price)}</span>
                  <span className="text-muted"> night</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function badgeVariant(status) {
  switch (status) {
    case "Accepted": return "success";
    case "Pending": return "secondary";
    case "Cancelled": return "danger";
    default: return "secondary";
  }
}
