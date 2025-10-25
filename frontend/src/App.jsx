import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "components/AppLayout";
import TravelerHome from "pages/TravelerHome";
import Login from "pages/Login";
import Signup from "pages/Signup";
import ProtectedRoute from "routes/ProtectedRoute";
import PropertyDetails from "./pages/PropertyDetails";
import Profile from "./pages/Profile";
import Wishlists from "./pages/Wishlists";
import BookingRequest from "./pages/BookingRequest";  
import Bookings from "./pages/Bookings";              
import BookingDetails from "./pages/BookingDetails";  

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
          <Route path="/wishlists" element={<Wishlists />} />
          <Route path="/booking-request" element={<BookingRequest />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
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
