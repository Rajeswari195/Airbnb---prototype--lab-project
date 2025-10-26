import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { travelerApi } from "../services/api";
import ProfileModal from "../components/Profile/ProfileModal";
import "./Profile.css";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const hostMode = !!location.state?.hostMode;
  const [activeSection, setActiveSection] = useState("about");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await travelerApi.me();
      if (typeof data.languages === "string") {
        try { data.languages = JSON.parse(data.languages); } catch { data.languages = []; }
      }
      setMe(data);
    } catch (e) {
      setErr(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const isComplete = useMemo(() => {
    if (!me) return false;
    const hasAny =
      !!(me.about && me.about.trim()) ||
      !!(me.city && me.city.trim()) ||
      !!(me.state && me.state.trim()) ||
      !!(me.country && me.country.trim()) ||
      (!!me.languages && me.languages.length > 0) ||
      !!(me.gender && me.gender.trim()) ||
      !!(me.phone && me.phone.trim());
    return hasAny;
  }, [me]);

  function openComplete() { setShowModal(true); }
  function openEdit() { setShowModal(true); }
  function onSaved(updated) { setMe(updated); setShowModal(false); }

  if (loading) return <div className="container py-5">Loading…</div>;
  if (err) return <div className="container py-5 text-danger">{err}</div>;
  if (!me) return null;

  const initial = String(me.name || me.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="container py-4">
      <div className="profile-layout">
        <div>
          <h2 className="profile-rail-title">Profile</h2>
          <div className="profile-rail-nav">
            <button
              type="button"
              className={`profile-rail-item ${activeSection === "about" ? "active" : ""}`}
              onClick={() => setActiveSection("about")}
            >
              <span className="me-2"><i className="bi bi-person-circle" /></span>
              About me
            </button>

            {!hostMode && (
              <>
                <button
                  type="button"
                  className={`profile-rail-item ${activeSection === "past" ? "active" : ""}`}
                  onClick={() => setActiveSection("past")}
                >
                  <span className="me-2"><i className="bi bi-suitcase-lg" /></span>
                  Past trips
                </button>

                <button
                  type="button"
                  className="profile-rail-item"
                  onClick={() => navigate("/bookings")}
                >
                  <span className="me-2"><i className="bi bi-journal-bookmark" /></span>
                  Bookings
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          {activeSection === "about" && (
            <>
              <div className="card profile-card shadow-sm mb-3">
                <div className="card-body d-flex align-items-center flex-column py-4">
                  {me.avatar_url ? (
                    <img src={me.avatar_url} alt="avatar" className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar">{initial}</div>
                  )}
                  <h4 className="mt-3 mb-1 profile-name">{me.name || me.email}</h4>
                  <div className="text-muted">Guest</div>
                </div>
              </div>

              {isComplete && (
                <div className="card profile-edit-card shadow-sm position-relative">
                  <button
                    className="btn btn-outline-dark btn-sm position-absolute top-0 end-0 m-2"
                    onClick={openEdit}
                  >
                    Edit
                  </button>

                  <div className="card-body">
                    <h6 className="fw-semibold mb-3">Profile information</h6>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Name</dt>
                      <dd className="col-sm-8">{me.name}</dd>

                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8">{me.email}</dd>

                      {me.phone ? (
                        <>
                          <dt className="col-sm-4">Phone</dt>
                          <dd className="col-sm-8">{me.phone}</dd>
                        </>
                      ) : null}

                      {me.about ? (
                        <>
                          <dt className="col-sm-4">About me</dt>
                          <dd className="col-sm-8">{me.about}</dd>
                        </>
                      ) : null}

                      {(me.city || me.state || me.country) ? (
                        <>
                          <dt className="col-sm-4">Location</dt>
                          <dd className="col-sm-8">
                            {[me.city, me.state, me.country].filter(Boolean).join(", ")}
                          </dd>
                        </>
                      ) : null}

                      {me.languages?.length ? (
                        <>
                          <dt className="col-sm-4">Languages</dt>
                          <dd className="col-sm-8">{me.languages.join(", ")}</dd>
                        </>
                      ) : null}

                      {me.gender ? (
                        <>
                          <dt className="col-sm-4">Gender</dt>
                          <dd className="col-sm-8">{me.gender}</dd>
                        </>
                      ) : null}
                    </dl>
                  </div>
                </div>
              )}

              {!isComplete && (
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="mb-2">Complete your profile</h5>
                    <p className="text-muted small mb-3">
                      Your profile helps hosts and guests know you better. Add your
                      details to get the best experience.
                    </p>
                    <button className="btn btn-danger w-100" onClick={openComplete}>
                      Get started
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeSection === "past" && !hostMode && (
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">Past trips</h5>
                <div className="text-muted">No past trips yet.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ProfileModal
          initial={me}
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
