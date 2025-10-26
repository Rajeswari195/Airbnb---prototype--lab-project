import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ownerClient } from "../../services/ownerClient";
import "./owner.css";

const empty = {
  title: "", type: "apartment", description: "", amenities: [],
  price: "", address: "", city: "", bedrooms: 1, bathrooms: 1, capacity: 1,
};

const amenityOptions = ["Wifi","Kitchen","Washer","Dryer","Air conditioning","Heating","TV","Free parking"];

export default function ListingForm({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = useMemo(() => mode === "edit", [mode]);

  const [model, setModel] = useState(empty);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let on = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const p = await ownerClient.getProp(id);
        let am = p.amenities;
        if (typeof am === "string") { try { am = JSON.parse(am); } catch { am = []; } }
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
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id, isEdit]);

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
        await ownerClient.updateProp(id, payload);
      } else {
        await ownerClient.createProp(payload);
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
