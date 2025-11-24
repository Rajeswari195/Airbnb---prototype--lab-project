import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { travelerApi, ownerApi } from "../services/api";
import "./Login.css";

// ✅ Redux imports
import { useDispatch } from "react-redux";
import { setAuth } from "../features/auth/authSlice";

const HOST_INTENT_KEY = "host_intent";

export default function Login() {
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const pending = location.state || null;

  // ✅ now accepts an optional existingToken so we don’t call sessionToken twice
  async function completeHostFlowIfNeeded(existingToken) {
    const hasLocalIntent = localStorage.getItem(HOST_INTENT_KEY) === "1";
    const hasStateIntent = pending && pending.intent === "host";
    if (!hasLocalIntent && !hasStateIntent) return false;

    try {
      const tokenToUse =
        existingToken || (await travelerApi.sessionToken()).token;
      await ownerApi.exchange(tokenToUse);
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
      // 1) Normal login
      await travelerApi.login({ email, password });

      // 2) Get JWT/session token once (if backend exposes it)
      let token = null;
      try {
        const session = await travelerApi.sessionToken();
        token = session?.token || null;
      } catch {
        // ignore; we still mark user as authenticated in Redux
      }

      // 3) Store auth in Redux
      dispatch(
        setAuth({
          token,
          role: "TRAVELER",
        })
      );

      // 4) Host-intent flow (reuse token if we have it)
      const wentHost = await completeHostFlowIfNeeded(token);
      if (wentHost) {
        navigate("/owner", { replace: true });
        return;
      }

      // 5) Pending favorite flow
      if (pending && pending.intent === "favorite" && pending.propertyId) {
        try {
          await travelerApi.addFavorite(Number(pending.propertyId));
        } catch {}
        navigate(pending.from || "/", { replace: true });
        return;
      }

      // 6) Pending booking flow
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

      // 7) Default redirect
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

          <button
            className="btn btn-danger btn-lg w-100 auth-cta"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        <div className="auth-footer mt-4">
          New here?{" "}
          <Link to="/signup" state={pending}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
