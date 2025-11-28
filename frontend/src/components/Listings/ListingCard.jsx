import "./ListingCard.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { travelerApi } from "../../services/api";

const OWNER_API_BASE = process.env.REACT_APP_OWNER_API || "http://localhost:8001";

function resolvePhoto(src) {
  if (!src || typeof src !== "string") return null;
  if (src.startsWith("/uploads/")) {
    return `${OWNER_API_BASE}${src}`;
  }
  return src;
}

export default function ListingCard({ item, isFavorite = false, onToggleFavorite }) {
  const navigate = useNavigate();
  const location = useLocation();

  const title = item.title || "Untitled";
  const type = item.type || "";
  const city = item.city || "";
  const address = item.address || "";
  const locationLine = [city, address].filter(Boolean).join(" · ");
  const price = item.price != null ? Number(item.price) : null;
  const beds = item.bedrooms != null ? Number(item.bedrooms) : null;
  const baths = item.bathrooms != null ? Number(item.bathrooms) : null;
  const cap = item.capacity != null ? Number(item.capacity) : null;

  let thumb = item._thumb || null;
  if (!thumb && item.photos) {
    try {
      const arr = Array.isArray(item.photos) ? item.photos : JSON.parse(item.photos || "[]");
      if (Array.isArray(arr) && arr.length) thumb = arr[0];
    } catch {
    }
  }
  const thumbSrc = resolvePhoto(thumb);

  async function handleHeartClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof onToggleFavorite !== "function") return;

    try {
      await travelerApi.me();
      onToggleFavorite(item.id);
    } catch {
      navigate("/login", {
        state: {
          from: location.pathname + location.search,
          intent: "favorite",
          propertyId: item.id,
        },
        replace: false,
      });
    }
  }

  return (
    <Link to={`/properties/${item.id}`} className="text-decoration-none text-reset">
      <div className="card listing-card h-100 shadow-sm">
        <div className="listing-thumb-wrap">
          {thumbSrc ? (
            <img className="listing-thumb-img" src={thumbSrc} alt={title} />
          ) : (
            <div className="listing-thumb placeholder-wave">
              <div className="placeholder w-100 h-100"></div>
            </div>
          )}

          {typeof onToggleFavorite === "function" && (
            <button
              className={`wish-heart btn ${isFavorite ? "wish-heart--active" : ""}`}
              aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
              onClick={handleHeartClick}
              title={isFavorite ? "Saved" : "Save"}
            >
              <i className={`bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}`} />
            </button>
          )}
        </div>

        <div className="card-body">
          <h6 className="card-title mb-1 text-truncate">{title}</h6>
          {type && <div className="text-muted small mb-1 text-truncate">{type}</div>}
          {locationLine && <div className="text-muted small text-truncate">{locationLine}</div>}

          <div className="mt-2 small text-muted">
            {beds != null && <span className="me-2">{beds} bd</span>}
            {baths != null && <span className="me-2">{baths} ba</span>}
            {cap != null && <span className="me-2">{cap} guests</span>}
          </div>

          {price != null && (
            <div className="mt-2">
              <span className="fw-semibold">${price}</span>
              <span className="text-muted"> night</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
