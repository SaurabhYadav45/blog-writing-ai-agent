/**
 * Authentication Context Provider.
 * This module manages global authentication state (JWT tokens and User Profile information)
 * and exposes wrapper hooks to access login, logout, and token properties across React.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// TypeScript representation of the User Profile
interface User {
  id: number;
  email: string;
  full_name?: string;
}

// Authentication context interface
interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pull initial token from localStorage if present
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        // Sync token with local storage
        localStorage.setItem('token', token);
        try {
          // Verify token correctness by fetching current user profile
          const res = await fetch('http://localhost:8000/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
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
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
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
