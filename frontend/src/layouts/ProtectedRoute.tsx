/**
 * Protected Route Wrapper.
 * This component guards pages that require active user authentication
 * (e.g., Dashboard, Workspace). If the user is unauthenticated, they are
 * redirected to the /login page. Otherwise, child sub-routes are rendered.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to login if user session is not found
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render matching nested sub-route components
  return <Outlet />;
};
