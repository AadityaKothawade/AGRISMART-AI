// components/auth/ProtectedRoute.jsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="loading" style={{ height: '100vh' }}></div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;