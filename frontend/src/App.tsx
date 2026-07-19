/**
 * Main Application Component.
 * Configures the React Router navigation layout hierarchy, applying AuthProvider context
 * wrappers, public layouts, auth guards (PublicOnlyRoute), and secure guards (ProtectedRoute)
 * to restrict unauthorized page visits.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { PublicOnlyRoute } from './layouts/PublicOnlyRoute';

// Import Page components
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { Settings } from './pages/Settings';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Contact } from './pages/Contact';
import { Feedback } from './pages/Feedback';
import { Docs } from './pages/Docs';
import { Blog } from './pages/Blog';
import { Cookies } from './pages/Cookies';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
        <Routes>
          {/* Public Landing Pages (Accessible to everyone) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/cookies" element={<Cookies />} />
          </Route>

          {/* Authentication Routes (Only accessible to unauthenticated guests) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Creator Workspace Routes (Requires valid JWT login session) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback Catch-All Route: Redirects unrecognized paths back to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
