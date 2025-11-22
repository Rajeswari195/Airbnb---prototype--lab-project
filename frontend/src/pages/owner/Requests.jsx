import { useEffect, useMemo, useState } from "react";
import { ownerClient } from "../../services/ownerClient";
import "./owner.css";

const tabs = ["All", "Pending", "Accepted", "Cancelled"];

export default function Requests() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await ownerClient.incoming();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load incoming bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "All") return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  async function handleAccept(id) {
    try {
      setBusyId(id);
      await ownerClient.accept(id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to accept booking");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id) {
    try {
      setBusyId(id);
      await ownerClient.cancel(id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to cancel booking");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Booking requests</h3>
      </div>

      <ul className="nav nav-tabs mb-3">
        {tabs.map((t) => (
          <li className="nav-item" key={t}>
            <button
              className={
                "nav-link" + (t === tab ? " active" : "")
              }
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading && <div>Loading…</div>}

      {!loading && !filtered.length && !err && (
        <div className="text-muted">No bookings yet.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Listing</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const start = formatDate(r.startDate);
                  const end = formatDate(r.endDate);

                  return (
                    <tr key={r.id}>
                      <td>{r.travelerName || r.travelerId}</td>
                      <td>
                        <div className="fw-semibold">{r.title}</div>
                        <div className="small text-muted">
                          {r.city}
                        </div>
                      </td>
                      <td className="small">
                        {start} → {end}
                      </td>
                      <td>{r.guests}</td>
                      <td>
                        <span className={`badge ${badge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === "Pending" && (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleAccept(r.id)}
                              disabled={busyId === r.id}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleCancel(r.id)}
                              disabled={busyId === r.id}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {r.status === "Accepted" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancel(r.id)}
                            disabled={busyId === r.id}
                          >
                            Cancel
                          </button>
                        )}
                        {r.status === "Cancelled" && (
                          <span className="text-muted small">
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10); 
}

function badge(s) {
  if (s === "Accepted") return "text-bg-success";
  if (s === "Pending") return "text-bg-warning";
  if (s === "Cancelled") return "text-bg-secondary";
  return "text-bg-light";
}
