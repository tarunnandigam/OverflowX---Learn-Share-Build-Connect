import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ adminOnly = false, allowUnverified = false }) => {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Check email and phone verification status
  // Note: if user is not loaded yet but token is present, we wait, or default to verified to avoid blink.
  // But usually user details are saved along with the token in localStorage.
  // Only require email verification for dashboard access
  const isVerified = user ? user.isEmailVerified : true;

  if (!isVerified && !allowUnverified) {
    // Redirect unverified users to the verification page
    return <Navigate to="/verify" replace />;
  }

  if (isVerified && allowUnverified) {
    // Already verified users don't need to visit verify page
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user && user.role !== 'admin') {
    // Redirect to main feed if trying to access admin page without admin role
    return <Navigate to="/" replace />;
  }

  // Render children routes
  return <Outlet />;
};

export default ProtectedRoute;
