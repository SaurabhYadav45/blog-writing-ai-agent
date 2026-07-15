import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Layers, FileText, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';

export const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/me/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FFFAF3]">
        <div className="animate-spin text-orange-500"><Zap size={32} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF3]">
      
      {/* Dashboard Navbar */}
      <Navbar />

      <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-orange-100"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, <span className="text-orange-500">{user?.full_name || user?.email?.split('@')[0] || 'Creator'}</span></h1>
            <p className="text-gray-500 mt-2 font-light">Here's what's happening with your workspace today.</p>
          </div>
          <Link 
            to="/workspace"
            className="px-6 py-3 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-xl w-fit"
            style={{
              borderRadius: "16px",
              border: "1.26px solid #FFAA67",
              background: "linear-gradient(95deg, #FFD0A2 4.5%, #FEB070 13.38%, #FF994F 31.58%, #FF7835 57.33%, #FF661F 79.98%, #FF5000 96.85%)",
              boxShadow: "1.26px 3.78px 7.686px 0 rgba(255, 102, 31, 0.3)",
              color: "#fff",
              fontWeight: 600
            }}
          >
            <Sparkles size={18} />
            Generate New Blog
          </Link>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Plan Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 text-orange-500">
              <Layers size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-1">Current Plan</p>
            <h2 className="text-3xl font-bold text-gray-900">{stats?.current_plan || 'Free'}</h2>
          </motion.div>

          {/* Credits Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 text-orange-500">
              <Zap size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-1">Remaining Credits</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold text-gray-900">{stats?.remaining_credits || 0}</h2>
              <span className="text-gray-400 font-medium">/ {stats?.total_credits_per_account || 5}</span>
            </div>
            {/* Progress bar visual */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, Math.max(0, ((stats?.remaining_credits || 0) / (stats?.total_credits_per_account || 5)) * 100))}%` }}
              />
            </div>
          </motion.div>

          {/* Blogs Generated Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 text-orange-500">
              <FileText size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-1">Total Blogs</p>
            <h2 className="text-3xl font-bold text-gray-900">{stats?.total_blogs_generated || 0}</h2>
            <p className="text-sm text-gray-400 mt-2">Generated by AI agents</p>
          </motion.div>

        </div>

        </div>
      </div>
    </div>
  );
};
