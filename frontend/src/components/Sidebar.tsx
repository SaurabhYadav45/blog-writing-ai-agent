import React, { useEffect, useState } from 'react';
import { Sparkles, History, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfigForm } from './ConfigForm';
import { ConfirmModal } from './ConfirmModal';


interface Blog {
  id: number;
  topic: string;
  status: string;
  created_at: string;
}

interface SidebarProps {
  onSelectBlog: (id: number) => void;
  onGenerate: (topic: string, tone: string, audience: string, depth: string, referenceUrls: string) => void;
  isGenerating: boolean;
  clearSignal: number;
}

export function Sidebar({ onSelectBlog, onGenerate, isGenerating, clearSignal }: SidebarProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/blogs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setBlogs(data);
      } else {
        console.error("Expected array but got:", data);
        setBlogs([]);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    
    // Quick polling to refresh history if a new blog was generated
    const interval = setInterval(fetchBlogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlogToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (blogToDelete === null) return;
    try {
      await fetch(`http://localhost:8000/api/blogs/${blogToDelete}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBlogs(prev => prev.filter(b => b.id !== blogToDelete));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setBlogToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBlogToDelete(null);
  };

  const handleRenameBlog = async (id: number, currentTopic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTopic = window.prompt("Enter new blog title:", currentTopic);
    if (!newTopic || newTopic === currentTopic) return;
    try {
      await fetch(`http://localhost:8000/api/blogs/${id}/title`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic: newTopic })
      });
      setBlogs(prev => prev.map(b => b.id === id ? { ...b, topic: newTopic } : b));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full md:w-80 glass-sidebar flex flex-col h-full md:h-screen overflow-y-auto custom-scrollbar bg-white/70">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 border border-orange-200">
            <img src="/icon.png" alt="BlogFusion Icon" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              BlogFusion
            </h1>
          </div>
        </div>
        <div className="mt-1">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/60 border border-orange-200/60 text-xs font-bold text-orange-700 uppercase tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            AI-Powered Blog Writing
          </span>
        </div>

        <ConfigForm onGenerate={onGenerate} disabled={isGenerating} clearSignal={clearSignal} />
      </div>
      
      <div className="flex-1 px-6 pb-6">
        <div className="flex items-center gap-2 text-slate-400 mb-3 px-1">
          <History className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Blog History</span>
        </div>
        
        {loading ? (
          <div className="text-slate-400 text-sm px-1 animate-pulse">Loading history...</div>
        ) : (
          <ul className="space-y-1.5">
            {blogs.map(blog => (
              <li key={blog.id}>
                <div 
                  onClick={() => onSelectBlog(blog.id)}
                  className="cursor-pointer w-full text-left p-2.5 rounded-lg hover:bg-white/50 border border-transparent hover:border-orange-100 transition-all flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <p className="text-sm font-semibold text-slate-700 truncate">{blog.topic}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(blog.created_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} &middot; 
                      <span className={blog.status === 'ERROR' ? 'text-red-500 ml-1 font-bold' : 'text-orange-500 ml-1'}>
                        {blog.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleRenameBlog(blog.id, blog.topic, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                      title="Rename Blog"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(blog.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Delete Blog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Delete Blog"
        message="Are you sure you want to permanently delete this blog? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
