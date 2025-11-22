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

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editGuests, setEditGuests] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const all = await travelerApi.listBookings();
      const found = Array.isArray(all)
        ? all.find((x) => String(x.id) === String(id))
        : null;
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  function startEditing() {
    if (!b) return;
    setEditStart(b.startDate?.slice(0, 10) || "");
    setEditEnd(b.endDate?.slice(0, 10) || "");
    setEditGuests(String(b.guests || 1));
    setEditing(true);
  }

  async function onSaveChanges() {
    if (!b) return;

    try {
      setSaving(true);

      const body = {
        startDate: editStart,
        endDate: editEnd,
        guests: Number(editGuests || b.guests || 1),
      };

      const updated = await travelerApi.updateBooking(b.id, body);

      alert(
        b.status === "Accepted" && updated.status === "Pending"
          ? "Booking updated and sent back to the host for approval."
          : "Booking updated."
      );

      setEditing(false);
      await load();
    } catch (e) {
      alert(e.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container py-4">Loading…</div>;
  if (err && !b) return <div className="container py-4">{err}</div>;
  if (!b) return null;

  const dates = `${b.startDate?.slice(0, 10)} → ${b.endDate?.slice(0, 10)}`;
  const guests = `${b.guests} guest${b.guests > 1 ? "s" : ""}`;
  const canCancel = b.status === "Pending";

  // allow modifying upcoming bookings that are Pending or Accepted
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDateObj = b.startDate ? new Date(b.startDate) : null;
  if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
  const canModify =
    (b.status === "Pending" || b.status === "Accepted") &&
    startDateObj &&
    startDateObj >= today;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Booking details</h3>
        <Link to="/bookings" className="btn btn-outline-secondary btn-sm">
          Back to trips
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{b.title}</h5>
                <span className={`badge text-bg-${badgeVariant(b.status)}`}>
                  {b.status}
                </span>
              </div>

              <div className="text-muted mt-1">{b.city}</div>
              <hr />

              <div className="row">
                <div className="col-sm-6 mb-2">
                  <div className="fw-semibold small text-uppercase text-muted">
                    Dates
                  </div>
                  <div>{dates}</div>
                </div>
                <div className="col-sm-6 mb-2">
                  <div className="fw-semibold small text-uppercase text-muted">
                    Guests
                  </div>
                  <div>{guests}</div>
                </div>
              </div>

              {canModify && (
                <div className="mt-3">
                  {!editing && (
                    <button
                      type="button"
                      className="btn btn-outline-primary me-2"
                      onClick={startEditing}
                      disabled={saving}
                    >
                      Modify booking
                    </button>
                  )}

                  {editing && (
                    <div className="border rounded p-3 mt-2">
                      <div className="row g-2">
                        <div className="col-sm-4">
                          <label className="form-label small">Start</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                          />
                        </div>
                        <div className="col-sm-4">
                          <label className="form-label small">End</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                          />
                        </div>
                        <div className="col-sm-4">
                          <label className="form-label small">Guests</label>
                          <input
                            type="number"
                            min="1"
                            className="form-control form-control-sm"
                            value={editGuests}
                            onChange={(e) =>
                              setEditGuests(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-2 d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={onSaveChanges}
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-muted"
                          onClick={() => setEditing(false)}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="small text-muted mt-1">
                        Updating an <strong>Accepted</strong> booking will send
                        it back to the host as <strong>Pending</strong> for
                        review.
                      </div>
                    </div>
                  )}
                </div>
              )}

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
            <div
              style={{
                position: "relative",
                paddingTop: "56%",
                background: "#f7f7f7",
              }}
            />
            <div className="card-body">
              <div className="fw-semibold mb-1">{b.title}</div>
              <div className="small text-muted">{b.city}</div>
              {b.price != null && (
                <div className="mt-2">
                  <span className="fw-semibold">
                    ${Number(b.price)}
                  </span>
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
