import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/Spinner';

/**
 * Protects officer routes — redirects to /login if not authenticated as officer
 */
export const OfficerRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Officers and demo users can access officer routes
  if (currentUser.role === 'citizen') {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return children;
};

/**
 * Protects citizen routes — redirects to /citizen/login if not authenticated as citizen
 */
export const CitizenRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/citizen/login" state={{ from: location }} replace />;
  }

  if (currentUser.role === 'officer') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Public route — redirects logged-in users to their portal
 */
export const PublicRoute = ({ children, portal = 'officer' }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (currentUser?.role === 'citizen') return <Navigate to="/citizen/dashboard" replace />;
  if (currentUser?.role === 'officer') return <Navigate to="/dashboard" replace />;
  if (currentUser) return <Navigate to="/dashboard" replace />;

  return children;
};
