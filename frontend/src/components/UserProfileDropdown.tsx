import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, ChevronDown, Sparkles, X, Settings } from 'lucide-react';
import { LogoutModal } from './LogoutModal';

export const UserProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <div className={`rounded-full ${user?.plan_name === 'Pro' ? 'p-[2px] bg-[linear-gradient(45deg,#4285F4,#EA4335,#FBBC05,#34A853)] shadow-md' : ''}`}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all group cursor-pointer ${user?.plan_name !== 'Pro' ? 'border border-orange-100' : 'w-full h-full'}`}
        >
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-700 hidden sm:block">{displayName}</span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 md:-right-2 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 bg-orange-50/50 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-700 bg-white/50 hover:bg-white rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              <p className="text-sm font-bold text-gray-900 truncate pr-6">{user?.full_name || 'Creator'}</p>
              <p className="text-xs text-gray-500 truncate pr-6">{user?.email}</p>
            </div>
            
            <div className="p-2 space-y-1">
              <Link 
                to="/dashboard" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${location.pathname === '/dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link 
                to="/workspace" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${location.pathname === '/workspace' ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}`}
              >
                <Sparkles size={18} />
                Workspace
              </Link>
              <Link 
                to="/settings" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${location.pathname === '/settings' ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}`}
              >
                <Settings size={18} />
                Settings
              </Link>
            </div>
            
            <div className="p-2 border-t border-gray-100">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogoutConfirm} 
      />
    </div>
  );
};
