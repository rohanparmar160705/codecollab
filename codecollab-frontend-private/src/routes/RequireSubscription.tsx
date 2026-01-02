import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireSubscription({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TODO: Add actual subscription check here when backend supports it
  // const user = getUser();
  // if (!user.isSubscribed) return <Navigate to="/billing" />;

  return <>{children}</>;
}
