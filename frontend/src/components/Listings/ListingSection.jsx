import { useEffect, useMemo, useState } from "react";
import { travelerApi } from "../../services/api";
import ListingCard from "./ListingCard";
import "./ListingSection.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchProperties } from "../../store/slices/propertySlice";

export default function ListingSection({ filters }) {
  const dispatch = useDispatch();
  const { list: items, loading, error } = useSelector((state) => state.properties);
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

  useEffect(() => {
    dispatch(fetchProperties(cleanedFilters));
  }, [dispatch, cleanedFilters]);

  // Load favorites separately (could be moved to Redux too)
  useEffect(() => {
    (async () => {
      try {
        const favs = await travelerApi.getFavorites();
        const map = {};
        (Array.isArray(favs) ? favs : []).forEach((f) => {
          map[f.propertyId] = f.id;
        });
        setFavMap(map);
      } catch {
        setFavMap({});
      }
    })();
  }, []);

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
        (Array.isArray(favs) ? favs : []).forEach(
          (f) => (map[f.propertyId] = f.id)
        );
        setFavMap(map);
      }
    } catch (e) {
      console.warn("Favorite toggle failed:", e.message);
    }
  }

  // Helper to get thumbnail from item (assuming backend returns photos now, or we handle it)
  // If backend doesn't return photos in list, we might show placeholder or fetch details.
  // For now, let's assume backend returns photos or we use placeholder.
  const getThumb = (it) => {
    if (it.photos && it.photos.length > 0) return it.photos[0];
    if (it.images && it.images.length > 0) return it.images[0];
    return null;
  };

  return (
    <section className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Explore stays</h5>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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
                item={{ ...it, _thumb: getThumb(it) }}
                isFavorite={!!favMap[it.id]}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
