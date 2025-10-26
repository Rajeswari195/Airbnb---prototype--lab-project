import { useEffect, useMemo, useState } from "react";
import { ownerClient } from "../../services/ownerClient";
import "./owner.css";

const tabs = ["All", "Pending", "Accepted", "Cancelled"];

export default function Requests() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await ownerClient.incoming();
      setRows(data || []);
    } catch (e) {
      setErr(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === "All") return rows;
    return rows.filter(r => r.status === tab);
  }, [rows, tab]);

  async function act(id, kind) {
    try {
      if (kind === "accept") await ownerClient.accept(id);
      else await ownerClient.cancel(id);
      setRows(rs => rs.map(r => r.id === id ? { ...r, status: kind === "accept" ? "Accepted" : "Cancelled" } : r));
    } catch (e) {
      alert(e.message || "Action failed");
    }
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h5 fw-bold m-0">Booking requests</h1>
      </div>

      <div className="mb-3 d-flex gap-2">
        {tabs.map(t => (
          <button key={t}
                  className={`btn btn-sm ${tab === t ? "btn-danger" : "btn-outline-secondary"}`}
                  onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover m-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th><th>Property</th><th>Dates</th><th>Guests</th><th>Status</th><th style={{width: 160}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.title} – {r.city}</td>
                    <td>{r.startDate} → {r.endDate}</td>
                    <td>{r.guests}</td>
                    <td><span className={`badge ${badge(r.status)}`}>{r.status}</span></td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-success"
                                disabled={r.status !== "Pending"}
                                onClick={() => act(r.id, "accept")}>
                          Accept
                        </button>
                        <button className="btn btn-sm btn-outline-secondary"
                                disabled={r.status === "Cancelled"}
                                onClick={() => act(r.id, "cancel")}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function badge(s) {
  if (s === "Accepted") return "text-bg-success";
  if (s === "Pending") return "text-bg-warning";
  if (s === "Cancelled") return "text-bg-secondary";
  return "text-bg-light";
}
