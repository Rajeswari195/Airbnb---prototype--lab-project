import { useEffect, useState } from "react";
import { ownerApi, travelerApi } from "../../services/api";
import "./Dashboard.css";

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await ownerApi.dashboard();
      setData(res);
    } catch (e) {
      try {
        const { token } = await travelerApi.sessionToken();
        await ownerApi.exchange(token);
        const res = await ownerApi.dashboard();
        setData(res);
      } catch (e2) {
        setErr(e2.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="container py-4">Loading…</div>;
  if (err) return <div className="container py-4 text-danger">{err}</div>;

  const recent = data?.recentRequests || [];
  const previous = data?.previousBookings || [];

  return (
    <div className="container py-4 owner-dashboard">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-bold m-0">Host Dashboard</h1>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card kpi-card shadow-sm">
            <div className="card-body">
              <div className="kpi-label">Pending requests</div>
              <div className="kpi-value">{recent.filter(r => r.status === "Pending").length}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card kpi-card shadow-sm">
            <div className="card-body">
              <div className="kpi-label">Accepted upcoming</div>
              <div className="kpi-value">{recent.filter(r => r.status === "Accepted").length}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card kpi-card shadow-sm">
            <div className="card-body">
              <div className="kpi-label">Past stays</div>
              <div className="kpi-value">{previous.length}</div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-4">
        <div className="section-header d-flex align-items-center justify-content-between">
          <h2 className="h5 m-0">Recent requests</h2>
        </div>
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover m-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Property</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.title} – {r.city}</td>
                    <td>{r.startDate} → {r.endDate}</td>
                    <td>{r.guests}</td>
                    <td>
                      <span className={`badge ${badgeClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status === 'Pending' && (
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success"
                            onClick={async () => {
                              try {
                                await ownerApi.acceptBooking(r.id);
                                load();
                              } catch (e) { alert(e.message); }
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={async () => {
                              try {
                                await ownerApi.cancelBooking(r.id);
                                load();
                              } catch (e) { alert(e.message); }
                            }}
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No recent requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="section-header d-flex align-items-center justify-content-between">
          <h2 className="h5 m-0">Previous bookings</h2>
        </div>
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover m-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Property</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previous.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.title} – {r.city}</td>
                    <td>{r.startDate} → {r.endDate}</td>
                    <td>{r.guests}</td>
                    <td><span className={`badge ${badgeClass(r.status)}`}>{r.status}</span></td>
                  </tr>
                ))}
                {!previous.length && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">No past bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function badgeClass(status) {
  if (status === "Accepted") return "text-bg-success";
  if (status === "Pending") return "text-bg-warning";
  if (status === "Cancelled") return "text-bg-secondary";
  return "text-bg-light";
}
