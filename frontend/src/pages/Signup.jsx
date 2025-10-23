import { Link } from "react-router-dom";
import "./Login.css";

export default function Signup() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">Create your account</div>

        <h1 className="auth-title">Welcome to Airbnb</h1>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">First name</label>
              <input type="text" className="form-control form-control-lg" placeholder="Enter first name" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Last name</label>
              <input type="text" className="form-control form-control-lg" placeholder="Enter last name" />
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold small">Email address</label>
            <input type="email" className="form-control form-control-lg" placeholder="you@example.com" />
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold small">Password</label>
            <input type="password" className="form-control form-control-lg" placeholder="Create a password" />
          </div>

          <button className="btn btn-danger btn-lg w-100 mt-3 auth-cta">Agree and continue</button>
        </form>

        <div className="auth-or">
          <span>or</span>
        </div>

        <div className="d-grid gap-2">
          <button className="btn btn-outline-dark btn-lg">
            <i className="bi bi-google me-2"></i> Continue with Google
          </button>
          <button className="btn btn-outline-dark btn-lg">
            <i className="bi bi-apple me-2"></i> Continue with Apple
          </button>
          <button className="btn btn-outline-dark btn-lg">
            <i className="bi bi-envelope me-2"></i> Continue with email
          </button>
        </div>

        <div className="auth-footer mt-3">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
