import { Navigate } from "react-router-dom";

// Placeholder guard: replace with real auth later
export default function ProtectedRoute({ children }) {
  const isAuthed = false; // TODO: wire with real auth
  return isAuthed ? children : <Navigate to="/login" replace />;
}
