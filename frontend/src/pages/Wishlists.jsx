import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { travelerApi } from "../services/api";
import "./Wishlists.css"; 

export default function Wishlists() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoverId, setHoverId] = useState(null);
  const [removing, setRemoving] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const favs = await travelerApi.getFavorites();
      setItems(Array.isArray(favs) ? favs : []);
    } catch (e) {
      setErr(e.message || "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(e, favId) {
    e.preventDefault();
    e.stopPropagation();
    try {
      setRemoving(favId);
      const deleter =
        travelerApi.favoritesRemove ||
        travelerApi.removeFavorite ||
        travelerApi.deleteFavorite;
      if (typeof deleter === "function") {
        await deleter(favId);
      }
      setItems((prev) => prev.filter((f) => f.id !== favId));
    } catch (err2) {
      alert(err2.message || "Failed to remove");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="container py-4">
      <h3 className="mb-3">Wishlists</h3>
      {err && <div className="alert alert-danger">{err}</div>}

      {loading && <div>Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="text-muted">No saved places yet.</div>
      )}

      <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
        {items.map((f) => (
          <div key={f.id} className="col">
            <div
              className="card h-100 shadow-sm position-relative"
              onMouseEnter={() => setHoverId(f.id)}
              onMouseLeave={() => setHoverId((id) => (id === f.id ? null : id))}
            >
              {(hoverId === f.id || removing === f.id) && (
                <button
                  type="button"
                  className="btn btn-light border rounded-circle position-absolute top-0 end-0 m-2 wishlist-remove-btn"
                  onClick={(e) => handleRemove(e, f.id)}
                  disabled={removing === f.id}
                  aria-label="Remove from wishlist"
                  title="Remove"
                >
                  <span className="wishlist-remove-btn__glyph">&times;</span>
                </button>
              )}

              <Link
                to={`/properties/${f.propertyId}`}
                className="text-decoration-none text-reset"
              >
                <div className="wishlist-thumb" />
                <div className="card-body">
                  <h6 className="mb-1 text-truncate">{f.title}</h6>
                  <div className="small text-muted text-truncate">{f.city}</div>
                  {f.price != null && (
                    <div className="mt-2">
                      <span className="fw-semibold">${Number(f.price)}</span>
                      <span className="text-muted"> night</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
