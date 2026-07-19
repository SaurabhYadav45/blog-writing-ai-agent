/**
 * User Dashboard Page.
 * Displays high-level analytics, generation activity, time saved, and top category charts.
 * Features:
 * - Radial gradient background matched to the landing page style guide.
 * - Low credit alerts if the user possesses 1 or fewer generation credits.
 * - Key metrics overview (total blogs, credits remaining, tokens processed, average word count).
 * - An interactive Recharts AreaChart plotting blog generation frequency over the past 30 days.
 * - A Recharts PieChart showing category (AI style) distributions.
 * - A horizontal grid displaying the top 5 latest draft blogs with fast "Open Blog" links.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../services/users';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Layers, FileText, Bot, Clock, Cpu, ArrowRight, AlertTriangle, Type, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

export const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch analytical stats from backend on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboard(token || '');
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
    <div className="min-h-screen relative overflow-hidden bg-[#FFFAF3]">
      {/* Decorative gradient overlay matched to 'How it works' homepage section */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
        style={{ backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%, #FFFAF3 0%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#F9F7F5 100%)' }}
      />
      <Navbar />

      <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">

        {/* Low Credit Warning Banner */}
        {stats?.remaining_credits <= 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm flex items-start gap-4"
          >
            <div className="bg-red-100 p-2 rounded-full text-red-600 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-red-800 font-bold">You are running low on credits!</h3>
              <p className="text-red-600 text-sm mt-1">You only have {stats?.remaining_credits} credits left. Upgrade to our Pro plan to continue generating high-quality blogs without interruption.</p>
            </div>
            <button 
              onClick={() => navigate('/settings?upgrade=true')}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 whitespace-nowrap cursor-pointer"
            >
              <Crown className="w-4 h-4 fill-white" />
              Upgrade Now
            </button>
          </motion.div>
        )}
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* Plan Name */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4 text-orange-500">
                <Layers size={20} />
              </div>
              <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">Current Plan</p>
              <h2 className="text-2xl font-bold text-gray-900">{stats?.current_plan || 'Free'}</h2>
              {stats?.current_plan === 'Pro' && user?.plan_expires_at && (
                <p className="text-xs text-orange-600 font-medium mt-1">
                  Expires {new Date(user.plan_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {stats?.current_plan === 'Free' && (
              <Link 
                to="/settings?upgrade=true"
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
              >
                Upgrade to Pro <ArrowRight size={14} />
              </Link>
            )}
          </motion.div>

          {/* Credits Counter with custom percentage bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4 text-orange-500">
              <Zap size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">Remaining Credits</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{stats?.remaining_credits || 0}</h2>
              <span className="text-gray-400 font-medium text-sm">/ {stats?.total_credits_per_account || 1}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className={`h-full rounded-full ${stats?.remaining_credits <= 1 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, ((stats?.remaining_credits || 0) / (stats?.total_credits_per_account || 1)) * 100))}%` }}
              />
            </div>
          </motion.div>

          {/* Total Blogs Generated */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-500">
              <FileText size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">Total Blogs</p>
            <h2 className="text-2xl font-bold text-gray-900">{stats?.total_blogs_generated || 0}</h2>
          </motion.div>

          {/* LLM Tokens Processed */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 text-purple-500">
              <Cpu size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">Tokens Processed</p>
            <h2 className="text-2xl font-bold text-gray-900">{(stats?.total_tokens_processed || 0).toLocaleString()}</h2>
          </motion.div>

          {/* Average Word Count */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 hover:border-orange-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-500">
              <Type size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">Avg. Blog Length</p>
            <div className="flex items-baseline gap-1">
              <h2 className="text-2xl font-bold text-gray-900">{stats?.avg_blog_length?.toLocaleString() || 0}</h2>
              <span className="text-sm font-medium text-gray-500">words</span>
            </div>
          </motion.div>

        </div>

        {/* Analytics Charts Grid - 4 Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 30-Day Activity AreaChart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 flex flex-col"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">30-Day Activity</h3>
            {stats?.activity_chart_data && stats.activity_chart_data.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.activity_chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBlogs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} minTickGap={20} />
                    <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{stroke: '#f1f5f9', strokeWidth: 2}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="blogs" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorBlogs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No activity data available</div>
            )}
          </motion.div>

          {/* Content Breakdown Categories PieChart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1 bg-white p-6 rounded-[24px] shadow-sm border border-orange-100 flex flex-col"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">Top Categories</h3>
            {stats?.kind_chart_data && stats.kind_chart_data.length > 0 ? (
              <div className="h-48 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.kind_chart_data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.kind_chart_data.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm flex-1">No data available yet</div>
            )}
            <p className="text-xs text-gray-400 text-center mt-2">AI-determined content styles</p>
          </motion.div>

          {/* Time Saved Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[24px] shadow-sm border border-indigo-100 flex flex-col justify-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 text-indigo-500 shadow-sm">
              <Clock size={24} />
            </div>
            <p className="text-sm font-bold text-indigo-900/60 tracking-wider uppercase mb-2">Est. Time Saved</p>
            <h2 className="text-5xl font-extrabold text-indigo-900">{stats?.time_saved_hours || 0} <span className="text-2xl font-bold text-indigo-700">Hrs</span></h2>
            <p className="text-sm text-indigo-700 mt-4 font-medium">Based on avg. 3 hours per manually written blog.</p>
          </motion.div>

        </div>

        {/* Horizontal Recent Drafts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-100 w-full"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Drafts</h3>
            <button 
              onClick={() => navigate('/workspace', { state: { tab: 'History' } })}
              className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          {stats?.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.recent_activity.map((blog: any) => (
                <div key={blog.id} className="flex flex-col p-5 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group bg-white">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    blog.status === 'COMPLETED' || blog.status === 'DONE' ? 'bg-green-50 text-green-500' : 
                    blog.status === 'ERROR' ? 'bg-red-50 text-red-500' : 
                    'bg-amber-50 text-amber-500'
                  }`}>
                    <FileText size={18} />
                  </div>
                  
                  <h4 className="font-bold text-gray-900 line-clamp-2 min-h-[40px] text-sm mb-3" title={blog.topic}>
                    {blog.topic}
                  </h4>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">{new Date(blog.created_at + 'Z').toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      blog.status === 'COMPLETED' || blog.status === 'DONE' ? 'bg-green-100 text-green-700' : 
                      blog.status === 'ERROR' ? 'bg-red-100 text-red-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {blog.status}
                    </span>
                  </div>

                  {/* Fast redirect trigger to open the target blog directly in the workspace editor */}
                  <button 
                    onClick={() => navigate('/workspace', { state: { selectedBlogId: blog.id } })}
                    className="mt-4 w-full px-4 py-2.5 bg-orange-50 text-orange-600 font-bold text-sm rounded-xl hover:bg-orange-100 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Open Blog
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 w-full border-2 border-dashed border-gray-100 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Bot size={24} className="opacity-40" />
              </div>
              <p className="font-medium text-gray-500">No blogs generated yet.</p>
              <p className="text-sm mt-1">Click "Generate New Blog" to get started.</p>
            </div>
          )}
        </motion.div>

        </div>
      </div>
    </div>
  );
};
