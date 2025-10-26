import { useEffect, useMemo, useState } from "react";
import { travelerApi } from "../../services/api";
import ListingCard from "./ListingCard";
import "./ListingSection.css";

export default function ListingSection({ filters }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [favMap, setFavMap] = useState({});

  const cleanedFilters = useMemo(() => {
    const f = filters || {};
    const out = {};
    if (f.location) out.location = f.location;
    if (f.guests) out.guests = f.guests;
    if (f.startDate && f.endDate) {
      out.startDate = f.startDate;
      out.endDate = f.endDate;
    }
    return out;
  }, [filters]);

  async function load() {
    setLoading(true);
    setErr("");

    let base = [];
    try {
      const data = await travelerApi.listings(cleanedFilters);
      base = Array.isArray(data) ? data : [];
    } catch (e) {
      setErr(e.message || "Failed to load listings");
    }

    try {
      const withThumbs = await Promise.all(
        base.map(async (it) => {
          try {
            const detail = await travelerApi.getProperty(it.id);
            let photos = [];
            if (detail && detail.photos) {
              if (Array.isArray(detail.photos)) {
                photos = detail.photos;
              } else if (typeof detail.photos === "string") {
                try {
                  photos = JSON.parse(detail.photos || "[]");
                } catch {
                  photos = [];
                }
              }
            }
            return { ...it, _thumb: Array.isArray(photos) && photos.length ? photos[0] : null };
          } catch {
            return { ...it, _thumb: null };
          }
        })
      );
      setItems(withThumbs);
    } catch {
      setItems(base);
    } finally {
      setLoading(false);
    }

    try {
      const favs = await travelerApi.getFavorites();
      const map = {};
      (Array.isArray(favs) ? favs : []).forEach((f) => {
        map[f.propertyId] = f.id;
      });
      setFavMap(map);
    } catch (_) {
      setFavMap({});
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cleanedFilters)]);

  async function toggleFavorite(propertyId) {
    try {
      if (favMap[propertyId]) {
        await travelerApi.removeFavorite(favMap[propertyId]);
        setFavMap((m) => {
          const n = { ...m };
          delete n[propertyId];
          return n;
        });
      } else {
        await travelerApi.addFavorite(propertyId);
        const favs = await travelerApi.getFavorites();
        const map = {};
        (Array.isArray(favs) ? favs : []).forEach((f) => (map[f.propertyId] = f.id));
        setFavMap(map);
      }
    } catch (e) {
      console.warn("Favorite toggle failed:", e.message);
    }
  }

  return (
    <section className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Explore stays</h5>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
        {loading && items.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="col">
                <div className="card listing-card">
                  <div className="listing-thumb-wrap">
                    <div className="listing-thumb placeholder-wave">
                      <div className="placeholder w-100 h-100"></div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="placeholder-wave">
                      <span className="placeholder col-8"></span>
                    </div>
                    <div className="placeholder-wave mt-2">
                      <span className="placeholder col-5"></span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          : items.map((it) => (
              <div key={it.id} className="col">
                <ListingCard
                  item={it}
                  isFavorite={!!favMap[it.id]}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
      </div>
    </section>
  );
}
