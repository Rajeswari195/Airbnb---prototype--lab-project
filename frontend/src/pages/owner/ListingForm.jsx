import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ownerClient } from "../../services/ownerClient";
import { ownerApi } from "../../services/api"; 
import "./owner.css";

const empty = {
  title: "", type: "apartment", description: "", amenities: [],
  price: "", address: "", city: "", bedrooms: 1, bathrooms: 1, capacity: 1,
};

const amenityOptions = ["Wifi","Kitchen","Washer","Dryer","Air conditioning","Heating","TV","Free parking"];

export default function ListingForm({ mode }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const isEdit = useMemo(() => mode === "edit", [mode]);

  const [model, setModel] = useState(empty);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [photos, setPhotos] = useState([]); 
  const [working, setWorking] = useState(false); 
  const fileInputRef = useRef(null);
  const [createdId, setCreatedId] = useState(null);
  const effectiveId = isEdit ? routeId : createdId;

  useEffect(() => {
    if (!isEdit) return;
    let on = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const p = await ownerClient.getProp(routeId);
        let am = p.amenities;
        if (typeof am === "string") { try { am = JSON.parse(am); } catch { am = []; } }

        let ph = [];
        if (Array.isArray(p.photos)) {
          ph = p.photos;
        } else if (typeof p.photos === "string") {
          try { ph = JSON.parse(p.photos) || []; } catch { ph = []; }
        }

        setModel({
          title: p.title || "",
          type: p.type || "apartment",
          description: p.description || "",
          amenities: am || [],
          price: p.price || "",
          address: p.address || "",
          city: p.city || "",
          bedrooms: p.bedrooms ?? 1,
          bathrooms: p.bathrooms ?? 1,
          capacity: p.capacity ?? 1,
        });
        setPhotos(ph || []);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [routeId, isEdit]);

  function onChange(e) {
    const { name, value } = e.target;
    setModel(m => ({ ...m, [name]: name === "price" ? value : value }));
  }
  function onNum(name, v) {
    setModel(m => ({ ...m, [name]: Number(v) || 0 }));
  }
  function toggleAmenity(a) {
    setModel(m => {
      const has = m.amenities.includes(a);
      return { ...m, amenities: has ? m.amenities.filter(x => x !== a) : [...m.amenities, a] };
    });
  }

  function minimalCreatePayloadOrError() {
    const missing = [];
    const required = [
      ["title", model.title?.trim()],
      ["type", model.type],
      ["price", model.price],
      ["city", model.city?.trim()],
      ["bedrooms", model.bedrooms],
      ["bathrooms", model.bathrooms],
      ["capacity", model.capacity],
    ];
    for (const [k, v] of required) {
      if (v === undefined || v === null || v === "" || (typeof v === "number" && Number.isNaN(v))) {
        missing.push(k);
      }
    }
    if (missing.length) {
      return { error: `Please fill these before adding photos: ${missing.join(", ")}` };
    }
    return {
      payload: {
        title: model.title.trim(),
        type: model.type,
        description: model.description || "",
        amenities: model.amenities || [],
        price: Number(model.price),
        address: model.address || "",
        city: model.city || "",
        bedrooms: Number(model.bedrooms || 0),
        bathrooms: Number(model.bathrooms || 0),
        capacity: Number(model.capacity || 1),
      }
    };
  }

  async function ensureIdForUploads() {
    if (effectiveId) return effectiveId;
    const check = minimalCreatePayloadOrError();
    if (check.error) {
      setErr(check.error);
      throw new Error(check.error);
    }
    const { payload } = check;
    const created = await ownerClient.createProp(payload);
    const newId = created?.id;
    if (!newId) throw new Error("Failed to create listing for uploads");
    setCreatedId(newId);
    return newId;
  }

  async function onSelectPhotos(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setErr("");
    setWorking(true);
    try {
      const id = await ensureIdForUploads();
      const uploadedUrls = [];
      for (const f of files) {
        const res = await ownerApi.uploadPhoto(id, f);
        if (res?.url) uploadedUrls.push(res.url);
      }
      setPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (e2) {
      setErr(e2.message || "Photo upload failed");
    } finally {
      setWorking(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const payload = {
        title: model.title.trim(),
        type: model.type,
        description: model.description || "",
        amenities: model.amenities || [],
        price: Number(model.price),
        address: model.address || "",
        city: model.city || "",
        bedrooms: Number(model.bedrooms || 0),
        bathrooms: Number(model.bathrooms || 0),
        capacity: Number(model.capacity || 1),
      };

      if (isEdit) {
        await ownerClient.updateProp(routeId, payload);
      } else {
        if (!createdId) {
          const created = await ownerClient.createProp(payload);
          setCreatedId(created?.id || null);
        } else {
          await ownerClient.updateProp(createdId, payload);
        }
      }
      navigate("/owner/listings");
    } catch (e2) {
      setErr(e2.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading…</div>;

  return (
    <form className="card shadow-sm" onSubmit={save}>
      <div className="card-body">
        <h5 className="fw-bold mb-3">{isEdit ? "Edit listing" : "Create listing"}</h5>
        {err && <div className="alert alert-danger">{err}</div>}

        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Title</label>
            <input className="form-control" name="title" value={model.title} onChange={onChange} required />
          </div>
          <div className="col-md-4">
            <label className="form-label">Type</label>
            <select className="form-select" name="type" value={model.type} onChange={onChange}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="room">Room</option>
              <option value="villa">Villa</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="col-md-12">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={4} name="description" value={model.description} onChange={onChange} />
          </div>

          <div className="col-md-4">
            <label className="form-label">Price / night</label>
            <input className="form-control" name="price" type="number" min="0" step="1"
                   value={model.price} onChange={onChange} required />
          </div>
          <div className="col-md-8">
            <label className="form-label">Address</label>
            <input className="form-control" name="address" value={model.address} onChange={onChange} />
          </div>

          <div className="col-md-5">
            <label className="form-label">City</label>
            <input className="form-control" name="city" value={model.city} onChange={onChange} required />
          </div>
          <div className="col-md-2">
            <label className="form-label">Bedrooms</label>
            <input className="form-control" type="number" min="0" value={model.bedrooms}
                   onChange={e => onNum("bedrooms", e.target.value)} required />
          </div>
          <div className="col-md-2">
            <label className="form-label">Bathrooms</label>
            <input className="form-control" type="number" min="0" value={model.bathrooms}
                   onChange={e => onNum("bathrooms", e.target.value)} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Capacity</label>
            <input className="form-control" type="number" min="1" value={model.capacity}
                   onChange={e => onNum("capacity", e.target.value)} required />
          </div>

          <div className="col-md-12">
            <label className="form-label">Amenities</label>
            <div className="d-flex flex-wrap gap-2">
              {amenityOptions.map(a => (
                <label key={a} className={`btn btn-sm ${model.amenities.includes(a) ? "btn-danger" : "btn-outline-secondary"}`}>
                  <input type="checkbox" className="d-none"
                         checked={model.amenities.includes(a)}
                         onChange={() => toggleAmenity(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <div className="col-md-12">
            <label className="form-label">Photos</label>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="form-control"
                style={{ maxWidth: 360 }}
                onChange={onSelectPhotos}
                disabled={working}
              />
              {working && <span className="small text-muted">Uploading…</span>}
            </div>

            {photos?.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {photos.map((u, i) => (
                  <div key={i} className="border rounded" style={{ width: 100, height: 80, overflow: "hidden" }}>
                    <img
                      src={u.startsWith("/uploads/") ? (process.env.REACT_APP_OWNER_API + u) : u}
                      alt={`photo-${i}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="form-text">
              Tip: selecting photos in “Create” will auto-create the listing behind the scenes, then upload.
            </div>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-danger" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/owner/listings")}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
