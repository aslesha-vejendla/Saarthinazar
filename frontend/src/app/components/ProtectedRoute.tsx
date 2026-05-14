import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → go to dashboard
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // If children passed, render them; otherwise render nested routes via Outlet
  return <>{children ?? <Outlet />}</>;
}