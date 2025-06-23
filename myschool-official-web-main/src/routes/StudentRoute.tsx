
import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface StudentRouteProps {
  children: React.ReactNode;
}

export const StudentRoute = ({ children }: StudentRouteProps) => {
  return <ProtectedRoute requiredRole="student">{children}</ProtectedRoute>;
};

export default StudentRoute;
