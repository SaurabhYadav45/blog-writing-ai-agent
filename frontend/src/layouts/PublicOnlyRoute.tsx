/**
 * Public Only Route Wrapper.
 * Re-routes logged-in users away from authentication pages (such as Login or Signup)
 * back to the dashboard, ensuring a authenticated user doesn't access signup/login forms.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicOnlyRoute = () => {
  const { isAuthenticated } = useAuth();

  // If the user is already authenticated, redirect them away from login/signup back to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render the Login/Signup components
  return <Outlet />;
};
