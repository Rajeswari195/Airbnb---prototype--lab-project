import { Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./SideNav";               
import Dashboard from "./Dashboard";           
import Listings from "./Listings";
import ListingForm from "./ListingForm";
import Requests from "./Requests";
import "./owner.css";

export default function OwnerLayout() {
  return (
    <div className="container my-3">
      <div className="owner-shell">
        <SideNav />
        <div className="owner-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="listings" element={<Listings />} />
            <Route path="listings/new" element={<ListingForm mode="create" />} />
            <Route path="listings/:id/edit" element={<ListingForm mode="edit" />} />
            <Route path="requests" element={<Requests />} />
            <Route path="*" element={<Navigate to="/owner" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
