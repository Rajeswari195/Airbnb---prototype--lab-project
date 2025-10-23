import { Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">Log in or sign up</div>

        <h1 className="auth-title">Welcome to Airbnb</h1>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Email address</label>
            <input type="email" className="form-control form-control-lg" placeholder="you@example.com" />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Password</label>
            <input type="password" className="form-control form-control-lg" placeholder="Enter the password" />
          </div>

          <button className="btn btn-danger btn-lg w-100 auth-cta">Continue</button>
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
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
