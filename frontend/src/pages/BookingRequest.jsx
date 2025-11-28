import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { travelerApi } from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import { createBooking, resetBookingState } from "../store/slices/bookingSlice";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function BookingRequest() {
  const query = useQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: bookingLoading, error: bookingError, success } = useSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(resetBookingState());
    return () => {
      dispatch(resetBookingState());
    };
  }, [dispatch]);

  const propertyId = query.get("propertyId");
  const startDate = query.get("startDate") || "";
  const endDate = query.get("endDate") || "";
  const guests = Number(query.get("guests") || 1);

  const [meChecked, setMeChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");



  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const a = new Date(startDate);
    const b = new Date(endDate);
    const diff = (b - a) / (1000 * 60 * 60 * 24);
    return Number.isFinite(diff) && diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!propertyId || !startDate || !endDate || !guests) {
        navigate("/", { replace: true });
        return;
      }
      try {
        await travelerApi.me();
        if (!ignore) {
          setAuthed(true);
          setMeChecked(true);
        }
      } catch {
        setAuthed(false);
        setMeChecked(true);
        navigate("/login", {
          replace: true,
          state: {
            intent: "booking",
            propertyId,
            startDate,
            endDate,
            guests,
            from: `/booking-request?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}&guests=${guests}`,
          },
        });
        return;
      }

      try {
        setLoading(true);
        const data = await travelerApi.property(propertyId);
        if (!ignore) setP(data);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load property");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [propertyId, startDate, endDate, guests, navigate]);

  async function handleRequestToBook() {
    setErr("");
    if (!propertyId || !startDate || !endDate || !guests) {
      setErr("Missing booking details.");
      return;
    }

    const resultAction = await dispatch(createBooking({
      propertyId,
      startDate,
      endDate,
      guests,
    }));

    if (!createBooking.fulfilled.match(resultAction)) {
      setErr(resultAction.payload || "Failed to create booking");
    }
  }

  if (!meChecked) return null;

  const displayStart = startDate ? startDate.slice(0, 10) : "";
  const displayEnd = endDate ? endDate.slice(0, 10) : "";

  return (
    <div className="container py-4">
      <h3 className="mb-3">Request to book</h3>

      {(err || bookingError) && <div className="alert alert-danger">{err || bookingError}</div>}

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              {success ? (
                <div className="text-center py-4">
                  <h4 className="text-success mb-3">Booking Request Sent!</h4>
                  <p className="mb-4">Your request is awaiting confirmation from the host.</p>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => navigate("/bookings?tab=pending")}
                  >
                    View My Bookings
                  </button>
                </div>
              ) : (
                <>
                  <h5 className="mb-3">Confirm and Pay</h5>
                  <div className="mb-3">
                    <p>You are booking <strong>{p?.title}</strong> for <strong>{nights}</strong> nights.</p>
                    <p>Dates: <strong>{displayStart}</strong> to <strong>{displayEnd}</strong></p>
                    <p>Guests: <strong>{guests}</strong></p>
                  </div>

                  <button
                    className="btn btn-primary btn-lg mt-2 w-100"
                    onClick={handleRequestToBook}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? "Processing..." : "Create Booking"}
                  </button>

                  <div className="small text-muted mt-2">
                    You won’t be charged yet
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              {loading ? (
                <div className="placeholder-glow">
                  <span className="placeholder col-6" />{" "}
                  <span className="placeholder col-4" />
                </div>
              ) : p ? (
                <>
                  <div className="d-flex align-items-start">
                    <div
                      style={{
                        width: 90,
                        height: 70,
                        borderRadius: 8,
                        background: "#f3f3f3",
                        backgroundImage: p.photos?.[0] ? `url(${p.photos[0]})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                      className="me-3"
                    />
                    <div>
                      <div className="fw-semibold">{p.title}</div>
                      <div className="text-muted small">{p.city}</div>
                    </div>
                  </div>

                  <hr />

                  <div className="small">
                    <div>
                      <strong>Dates:</strong> {displayStart} → {displayEnd}
                    </div>
                    <div>
                      <strong>Guests:</strong> {guests}
                    </div>
                    <div>
                      <strong>Nights:</strong> {nights}
                    </div>
                  </div>

                  <hr />

                  {typeof p.price !== "undefined" && (
                    <div className="small">
                      <div className="d-flex justify-content-between">
                        <span>
                          ${Number(p.price)} × {nights} night
                          {nights !== 1 ? "s" : ""}
                        </span>
                        <span>
                          ${(Number(p.price) * nights || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mt-2 fw-semibold">
                        <span>Total</span>
                        <span>
                          ${(Number(p.price) * nights || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted">Property unavailable.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
