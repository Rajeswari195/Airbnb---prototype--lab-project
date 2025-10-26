import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { travelerApi, ownerApi } from "../services/api";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isOwnerArea = location.pathname.startsWith("/owner");

  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function confirmOwnerReady() {
      try {
        await ownerApi.dashboard();
      } catch {
        await new Promise(r => setTimeout(r, 150));
        await ownerApi.dashboard();
      }
    }

    async function run() {
      try {
        if (isOwnerArea) {
          try {
            await ownerApi.dashboard();
            if (mounted) setOk(true);
            return;
          } catch {

          }

          await travelerApi.me(); 
          const { token } = await travelerApi.sessionToken();
          await ownerApi.exchange(token);
          await confirmOwnerReady();
          if (mounted) setOk(true);
          return;
        }

        await travelerApi.me();
        if (mounted) setOk(true);
      } catch {
        if (mounted) setOk(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => { mounted = false; };
  }, [isOwnerArea, location.pathname]);

  if (loading) return null; 
  return ok ? children : <Navigate to="/login" replace />;
}
