// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";
import Loading from "./loader/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setAuth(authenticated);
    };
    checkAuth();
  }, []);

  if (auth === null) {
    return <Loading />;
  }

  if (!auth) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};