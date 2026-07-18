/**
 * Authentication Context Provider.
 * This module manages global authentication state (JWT tokens and User Profile information)
 * and exposes wrapper hooks to access login, logout, and token properties across React.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/users';


// TypeScript representation of the User Profile
interface User {
  id: number;
  email: string;
  full_name?: string;
  plan_name?: string;
  credits?: number;
  plan_expires_at?: string;
  cloudinary_cloud_name?: string;
  cloudinary_api_key?: string;
  cloudinary_api_secret?: string;
  cms_wordpress_url?: string;
  cms_wordpress_username?: string;
  cms_wordpress_app_password?: string;
  cms_medium_token?: string;
  cms_linkedin_token?: string;
  cms_linkedin_author_urn?: string;
  brand_persona?: string;
}

// Authentication context interface
interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pull initial token from localStorage if present
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    if (token) {
      // Sync token with local storage
      localStorage.setItem('token', token);
      try {
        // Verify token correctness by fetching current user profile
        const res = await getMe(token);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token is likely expired or invalid; clear authentication state
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
      }
    } else {
      // Clear storage if token is null
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  // Sets active token (used during login/signup success)
  const login = (newToken: string) => {
    setToken(newToken);
  };

  // Clears active token (used during signout)
  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshUser: fetchUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Global hook to consume the authentication state in child components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
