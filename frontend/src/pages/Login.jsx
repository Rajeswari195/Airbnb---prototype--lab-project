import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { travelerApi, ownerApi } from "../services/api";
import "./Login.css";

const HOST_INTENT_KEY = "host_intent"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const pending = location.state || null;

  async function completeHostFlowIfNeeded() {
    const hasLocalIntent = localStorage.getItem(HOST_INTENT_KEY) === "1";
    const hasStateIntent = pending && pending.intent === "host";
    if (!hasLocalIntent && !hasStateIntent) return false;

    try {
      const { token } = await travelerApi.sessionToken();
      await ownerApi.exchange(token);
      await ownerApi.enableHost(); 
    } finally {
      localStorage.removeItem(HOST_INTENT_KEY);
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      await travelerApi.login({ email, password });

      const wentHost = await completeHostFlowIfNeeded();
      if (wentHost) {
        navigate("/owner", { replace: true });
        return;
      }

      if (pending && pending.intent === "favorite" && pending.propertyId) {
        try { await travelerApi.addFavorite(Number(pending.propertyId)); } catch {}
        navigate(pending.from || "/", { replace: true });
        return;
      }

      if (
        pending &&
        pending.intent === "booking" &&
        pending.propertyId &&
        pending.startDate &&
        pending.endDate &&
        pending.guests
      ) {
        const url = `/booking-request?propertyId=${pending.propertyId}&startDate=${pending.startDate}&endDate=${pending.endDate}&guests=${pending.guests}`;
        navigate(url, { replace: true });
        return;
      }

      navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">Log in or sign up</div>

        <h1 className="auth-title">Welcome to Airbnb</h1>

        {err && <div className="alert alert-danger py-2">{err}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Email address</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Password</label>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="btn btn-danger btn-lg w-100 auth-cta" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        <div className="auth-footer mt-4">
          New here? <Link to="/signup" state={pending}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}