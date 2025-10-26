import { useEffect, useState } from "react";
import { ownerApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "./Listings.css";

export default function Listings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const list = await ownerApi.listings();
      setRows(list || []);
    } catch (e) {
      setErr(e.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h5 m-0">Your listings</h1>
        <button
          className="btn btn-danger"
          onClick={() => navigate("/owner/listings/new")}
        >
          Add listing
        </button>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && !rows.length && (
        <div className="text-muted">No listings yet. Click “Add listing”.</div>
      )}

      {!!rows.length && (
        <div className="row g-3">
          {rows.map((p) => {
            const price =
              p.price != null
                ? Number(p.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : null;

            const bd =
              typeof p.bedrooms === "number" ? `${p.bedrooms} bd` : null;
            const ba =
              typeof p.bathrooms === "number" ? `${p.bathrooms} ba` : null;
            const gs =
              typeof p.capacity === "number" ? `${p.capacity} guests` : null;

            let amenPreview = null;
            if (Array.isArray(p.amenities) && p.amenities.length) {
              const top = p.amenities.slice(0, 3).join(", ");
              amenPreview = `Amenities: ${top}${
                p.amenities.length > 3 ? "…" : ""
              }`;
            }

            const details = [bd, ba, gs].filter(Boolean).join(" • ");

            return (
              <div className="col-12 col-md-6 col-lg-4" key={p.id}>
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="fw-semibold mb-1">{p.title}</div>

                    <div className="text-muted small mb-1">
                      {p.city} • {p.type} • {price ? `$${price}/night` : ""}
                    </div>

                    {(details || amenPreview) && (
                      <div className="text-muted small mb-2">
                        {details}
                        {details && amenPreview ? " • " : ""}
                        {amenPreview}
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate(`/owner/listings/${p.id}/edit`)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
