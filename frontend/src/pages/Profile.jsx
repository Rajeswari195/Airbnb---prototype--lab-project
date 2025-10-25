import { useEffect, useMemo, useState } from "react";
import { travelerApi } from "../services/api";
import ProfileModal from "../components/Profile/ProfileModal";
import "./Profile.css";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [activeTab, setActiveTab] = useState("about");

  const [pastTrips, setPastTrips] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastErr, setPastErr] = useState("");
  const [pastLoaded, setPastLoaded] = useState(false);

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
    return !!(
      me.about?.trim() ||
      me.city?.trim() ||
      me.state?.trim() ||
      me.country?.trim() ||
      (me.languages?.length) ||
      me.gender?.trim() ||
      me.phone?.trim()
    );
  }, [me]);

  function openComplete() { setShowModal(true); }
  function openEdit() { setShowModal(true); }
  function onSaved(updated) { setMe(updated); setShowModal(false); }

  useEffect(() => {
    async function loadPast() {
      setPastLoading(true);
      setPastErr("");
      try {
        const rows = await travelerApi.listBookings({ scope: "past" });
        setPastTrips(Array.isArray(rows) ? rows : []);
      } catch (e) {
        setPastErr(e.message || "Failed to load past trips");
      } finally {
        setPastLoading(false);
        setPastLoaded(true);
      }
    }
    if (activeTab === "past" && !pastLoaded) loadPast();
  }, [activeTab, pastLoaded]);

  if (loading) return <div className="container py-5">Loading…</div>;
  if (err) return <div className="container py-5 text-danger">{err}</div>;
  if (!me) return null;

  const initial = String(me.name || me.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="container py-4">
      <div className="profile-layout">
        {/* Left rail */}
        <aside>
          <h3 className="profile-rail-title">About me</h3>

          <nav className="profile-rail-nav">
            <button
              type="button"
              className={`profile-rail-item ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              <i className="bi bi-person-circle me-2" />
              About me
            </button>

            <button
              type="button"
              className={`profile-rail-item ${activeTab === "past" ? "active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              <i className="bi bi-suitcase-fill me-2" />
              Past trips
            </button>

            <button type="button" className="profile-rail-item">
              <i className="bi bi-people-fill me-2" />
              Connections
            </button>
          </nav>
        </aside>

        <main>
          {activeTab === "about" && (
            <div className="profile-grid">
              <section>
                <div className="card shadow-sm profile-card">
                  <div className="card-body d-flex align-items-center flex-column py-4">
                    <div className="profile-avatar">{initial}</div>
                    <h4 className="mt-3 mb-1 profile-name">{me.name || me.email}</h4>
                    <div className="text-muted">Guest</div>
                  </div>
                </div>

                {isComplete && (
                  <div className="card shadow-sm mt-3 position-relative profile-edit-card">
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

                        {me.phone && <>
                          <dt className="col-sm-4">Phone</dt>
                          <dd className="col-sm-8">{me.phone}</dd>
                        </>}

                        {me.about && <>
                          <dt className="col-sm-4">About me</dt>
                          <dd className="col-sm-8">{me.about}</dd>
                        </>}

                        {(me.city || me.state || me.country) && <>
                          <dt className="col-sm-4">Location</dt>
                          <dd className="col-sm-8">
                            {[me.city, me.state, me.country].filter(Boolean).join(", ")}
                          </dd>
                        </>}

                        {me.languages?.length > 0 && <>
                          <dt className="col-sm-4">Languages</dt>
                          <dd className="col-sm-8">{me.languages.join(", ")}</dd>
                        </>}

                        {me.gender && <>
                          <dt className="col-sm-4">Gender</dt>
                          <dd className="col-sm-8">{me.gender}</dd>
                        </>}
                      </dl>
                    </div>
                  </div>
                )}
              </section>

              {!isComplete && (
                <aside className="profile-side card p-3 d-none d-lg-block">
                  <div>
                    <h5 className="mb-2">Complete your profile</h5>
                    <p className="text-muted small mb-3">
                      Your profile helps hosts and guests know you better. Add your
                      details to get the best experience.
                    </p>
                    <button className="btn btn-danger w-100" onClick={openComplete}>
                      Get started
                    </button>
                  </div>
                </aside>
              )}
            </div>
          )}

          {activeTab === "past" && (
            <section className="card shadow-sm profile-card">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Past trips</h6>

                {pastLoading && <div>Loading…</div>}
                {pastErr && <div className="alert alert-danger">{pastErr}</div>}

                {!pastLoading && !pastErr && pastTrips.length === 0 && (
                  <div className="text-muted">No past trips yet.</div>
                )}

                {!pastLoading && !pastErr && pastTrips.length > 0 && (
                  <ul className="list-unstyled mb-0">
                    {pastTrips.map((b) => (
                      <li key={b.id} className="mb-3">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-semibold">{b.title}</div>
                            <div className="small text-muted">
                              {b.startDate?.slice(0, 10)} → {b.endDate?.slice(0, 10)} · {b.guests} guest{b.guests > 1 ? "s" : ""}
                            </div>
                          </div>
                          <span className="badge text-bg-secondary align-self-start">{b.status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </main>
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
