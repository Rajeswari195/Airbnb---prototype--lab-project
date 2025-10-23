import "./TravelerHome.css";
import { useState } from "react";

export default function TravelerHome() {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");

  return (
    <div className="container py-4">
      <div className="shadow-sm border rounded-pill d-flex align-items-center px-3 py-2 search-bar">
        <div className="flex-grow-1 px-3 border-end">
          <label className="search-label">Where</label>
          <input
            type="text"
            className="form-control border-0 p-0 shadow-none search-input"
            placeholder="Search destinations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="px-3 border-end">
          <label className="search-label">Check in</label>
          <input
            type="date"
            className="form-control border-0 p-0 shadow-none search-input"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>

        <div className="px-3 border-end">
          <label className="search-label">Check out</label>
          <input
            type="date"
            className="form-control border-0 p-0 shadow-none search-input"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>

        <div className="px-3 d-flex align-items-center">
          <div>
            <label className="search-label">Guests</label>
            <input
              type="number"
              min="1"
              className="form-control border-0 p-0 shadow-none search-input"
              placeholder="Add guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>
          <button className="btn-search ms-3">
            <i className="bi bi-search"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
