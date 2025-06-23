
import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface StaffRouteProps {
  children: React.ReactNode;
}

export const StaffRoute = ({ children }: StaffRouteProps) => {
  return <ProtectedRoute requiredRole="staff">{children}</ProtectedRoute>;
};

export default StaffRoute;
