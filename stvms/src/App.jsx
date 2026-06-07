import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { OfficerRoute, CitizenRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { OfficerLayout } from './components/layout/OfficerLayout';
import { CitizenLayout } from './components/layout/CitizenLayout';
import { Spinner } from './components/ui/Spinner';

// Lazy-load pages for code splitting
const UnifiedLoginPortal = lazy(() => import('./pages/UnifiedLoginPortal'));
const OfficerLogin       = lazy(() => import('./pages/officer/Login'));
const Dashboard          = lazy(() => import('./pages/officer/Dashboard'));
const LogViolation       = lazy(() => import('./pages/officer/LogViolation'));
const ViolationsList     = lazy(() => import('./pages/officer/ViolationsList'));
const ViolationDetail    = lazy(() => import('./pages/officer/ViolationDetail'));
const FinesList          = lazy(() => import('./pages/officer/FinesList'));
const VehiclesList       = lazy(() => import('./pages/officer/VehiclesList'));
const AnalyticsMap       = lazy(() => import('./pages/officer/AnalyticsMap'));

const CitizenLogin       = lazy(() => import('./pages/citizen/Login'));
const CitizenDashboard   = lazy(() => import('./pages/citizen/Dashboard'));
const MyViolations       = lazy(() => import('./pages/citizen/MyViolations'));
const PayFines           = lazy(() => import('./pages/citizen/PayFines'));
const ContestViolation   = lazy(() => import('./pages/citizen/ContestViolation'));
const RouteSafetyFinder   = lazy(() => import('./pages/citizen/RouteSafetyFinder'));

const PageLoader = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export const App = () => (
  <AuthProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0D2137',
          color: '#E2E8F0',
          border: '1px solid #1E3A5F',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#38A169', secondary: '#0D2137' } },
        error:   { iconTheme: { primary: '#E53E3E', secondary: '#0D2137' } },
      }}
    />

    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Unified Portal Root Selection */}
        <Route path="/" element={<UnifiedLoginPortal />} />

        {/* ===== OFFICER PORTAL ===== */}
        <Route path="/login" element={
          <PublicRoute portal="officer">
            <OfficerLogin />
          </PublicRoute>
        } />

        <Route element={
          <OfficerRoute>
            <OfficerLayout />
          </OfficerRoute>
        }>
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/violations"       element={<ViolationsList />} />
          <Route path="/violations/new"   element={<LogViolation />} />
          <Route path="/violations/:id"   element={<ViolationDetail />} />
          <Route path="/fines"            element={<FinesList />} />
          <Route path="/vehicles"         element={<VehiclesList />} />
          <Route path="/analytics"        element={<AnalyticsMap />} />
        </Route>

        {/* ===== CITIZEN PORTAL ===== */}
        <Route path="/citizen/login" element={
          <PublicRoute portal="citizen">
            <CitizenLogin />
          </PublicRoute>
        } />

        <Route element={
          <CitizenRoute>
            <CitizenLayout />
          </CitizenRoute>
        }>
          <Route path="/citizen/dashboard"        element={<CitizenDashboard />} />
          <Route path="/citizen/violations"       element={<MyViolations />} />
          <Route path="/citizen/fines"            element={<PayFines />} />
          <Route path="/citizen/routes"           element={<RouteSafetyFinder />} />
          <Route path="/citizen/contest/:id"      element={<ContestViolation />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  </AuthProvider>
);

export default App;
