import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserProfileDropdown } from './UserProfileDropdown';

export const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center transition-all duration-300">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon.png" alt="icon" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
          <span className="font-extrabold text-xl tracking-tight text-gray-900">
            BlogFusion
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-900">
          <a href="/#features" className="hover:text-[#FF4500] transition-colors">Features</a>
          <a href="/#how-it-works" className="hover:text-[#FF4500] transition-colors">How it works</a>
          <a href="/#pricing" className="hover:text-[#FF4500] transition-colors">Pricing</a>
          {isAuthenticated && (
            <Link to="/workspace" className={`hover:text-[#FF4500] transition-colors ${location.pathname === '/workspace' ? 'text-[#FF4500]' : ''}`}>Workspace</Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <UserProfileDropdown />
          ) : (
            <Link 
              to="/login" 
              className="px-5 py-2.5 flex items-center justify-center transition-all hover:scale-[1.02]"
              style={{
                borderRadius: "12px",
                border: "1.26px solid #FFAA67",
                background: "linear-gradient(95deg, #FFD0A2 4.5%, #FEB070 13.38%, #FF994F 31.58%, #FF7835 57.33%, #FF661F 79.98%, #FF5000 96.85%)",
                boxShadow: "1.26px 3.78px 7.686px 0 rgba(0, 0, 0, 0.20)",
                color: "#fff",
                fontWeight: 600
              }}
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
