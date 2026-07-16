/**
 * Main Application Component.
 * Configures the React Router navigation layout hierarchy, applying AuthProvider context
 * wrappers, public layouts, auth guards (PublicOnlyRoute), and secure guards (ProtectedRoute)
 * to restrict unauthorized page visits.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { PublicOnlyRoute } from './layouts/PublicOnlyRoute';

// Import Page components
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing Pages (Accessible to everyone) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* Authentication Routes (Only accessible to unauthenticated guests) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Protected Creator Workspace Routes (Requires valid JWT login session) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace" element={<Workspace />} />
          </Route>

          {/* Fallback Catch-All Route: Redirects unrecognized paths back to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
