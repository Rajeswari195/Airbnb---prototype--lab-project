import { NavLink } from "react-router-dom";

export default function SideNav() {
  return (
    <aside className="owner-sidenav">
      <div className="mb-3 fw-bold text-muted">Host</div>
      <nav className="d-flex flex-column gap-1">
        <NavLink end to="/owner" className="nav-link">
          <i className="bi bi-speedometer2"></i> Dashboard
        </NavLink>
        <NavLink to="/owner/listings" className="nav-link">
          <i className="bi bi-houses"></i> Listings
        </NavLink>
        <NavLink to="/owner/requests" className="nav-link">
          <i className="bi bi-inbox"></i> Requests
        </NavLink>
      </nav>
    </aside>
  );
}
