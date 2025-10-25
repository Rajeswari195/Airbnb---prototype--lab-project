import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "components/AppLayout";
import TravelerHome from "pages/TravelerHome";
import Login from "pages/Login";
import Signup from "pages/Signup";
import ProtectedRoute from "routes/ProtectedRoute";
import PropertyDetails from "./pages/PropertyDetails";
import Profile from "./pages/Profile";
import Wishlists from "./pages/Wishlists"; // <<< add

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TravelerHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlists" element={<Wishlists />} /> {/* <<< add */}

          <Route
            path="/owner"
            element={
              <ProtectedRoute>
                <div>Owner dashboard (coming soon)</div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
