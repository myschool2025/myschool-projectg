import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";
import Loading from "@/components/loader/Loading";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "staff" | "student";
}

interface User {
  id: string;
  email: string | null;
  name?: string | null;
  role: "admin" | "staff" | "student";
  verified: boolean;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [authStatus, setAuthStatus] = useState<{
    isLoading: boolean;
    user: User | null;
  }>({ isLoading: true, user: null });
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log("ProtectedRoute - Fetched user:", currentUser);
        if (isMounted) {
          setAuthStatus({ isLoading: false, user: currentUser });
        }
      } catch (error: any) {
        console.error("ProtectedRoute - Error checking authentication:", error);
        if (isMounted) {
          setAuthStatus({ isLoading: false, user: null });
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependencies to run once

  useEffect(() => {
    if (!authStatus.isLoading) {
      if (!authStatus.user) {
        console.log(
          `ProtectedRoute - Triggering toast for redirect to /unauthorized from ${location.pathname}`
        );
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please sign in or verify your account to access this page.",
        });
      } else if (requiredRole && authStatus.user.role !== requiredRole) {
        console.log(
          `ProtectedRoute - Triggering toast for role mismatch at ${location.pathname}`
        );
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have the required role to access this page.",
        });
      }
    }
  }, [authStatus, requiredRole, location.pathname, toast]);

  if (authStatus.isLoading) {
    console.log(`ProtectedRoute - Loading state for ${location.pathname}`);
    return <Loading />;
  }

  if (!authStatus.user) {
    console.log(
      `ProtectedRoute - Rendering Navigate to /unauthorized from ${location.pathname}`
    );
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  if (requiredRole && authStatus.user.role !== requiredRole) {
    console.log(
      `ProtectedRoute - Rendering Navigate to /unauthorized from ${location.pathname} - Role mismatch: User Role: ${authStatus.user.role}, Required: ${requiredRole}`
    );
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  console.log(`ProtectedRoute - Access granted to ${location.pathname} for user:`, authStatus.user);
  return <>{children}</>;
};

export default ProtectedRoute;