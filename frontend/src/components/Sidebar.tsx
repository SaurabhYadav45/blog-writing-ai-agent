import React, { useEffect, useState } from 'react';
import { History, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfigForm } from './ConfigForm';
import { ConfirmModal } from './ConfirmModal';
import { getBlogs, deleteBlog, updateBlogTitle } from '../services/blogs';
import { Link } from 'react-router-dom';


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
  onViewFullHistory: () => void;
  streamStatus?: string;
  onResume?: () => void;
}

export function Sidebar({ onSelectBlog, onGenerate, isGenerating, clearSignal, onViewFullHistory, streamStatus, onResume }: SidebarProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTopic, setEditTopic] = useState("");

  const fetchBlogs = async () => {
    try {
      const response = await getBlogs(token || '', 0, 5);
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
      await deleteBlog(blogToDelete, token || '');
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

  const handleRenameSubmit = async (id: number) => {
    if (!editTopic || editTopic.trim() === '') {
      setEditingId(null);
      return;
    }
    try {
      await updateBlogTitle(id, editTopic, token || '');
      setBlogs(prev => prev.map(b => b.id === id ? { ...b, topic: editTopic } : b));
    } catch (err) {
      console.error(err);
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="w-full md:w-80 glass-sidebar flex flex-col h-full md:h-screen overflow-y-auto custom-scrollbar bg-white/70">
      <div className="p-6 pb-2">

        <Link to="/" className="flex items-center gap-3">
          <img src="/icon.png" alt="icon" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
          <span className="font-extrabold text-xl tracking-tight text-gray-900">
            BlogFusion
          </span>
        </Link>
        <div className="mt-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/60 border border-orange-200/60 text-xs font-bold text-orange-700 uppercase tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            AI-Powered Blog Writing
          </span>
        </div>

        <ConfigForm 
          onGenerate={onGenerate} 
          disabled={isGenerating} 
          clearSignal={clearSignal} 
          isError={streamStatus === 'error'}
          onResume={onResume}
        />
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
                  onClick={() => {
                    if (editingId !== blog.id) onSelectBlog(blog.id);
                  }}
                  className="cursor-pointer w-full text-left p-2.5 rounded-lg hover:bg-white/50 border border-transparent hover:border-orange-100 transition-all flex items-center justify-between group"
                >
                  <div className="truncate pr-2 flex-1">
                    {editingId === blog.id ? (
                      <input 
                        type="text"
                        value={editTopic}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTopic(e.target.value)}
                        onBlur={() => handleRenameSubmit(blog.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(blog.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full text-sm font-semibold text-slate-700 bg-white border border-orange-300 rounded px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700 truncate">{blog.topic}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(blog.created_at + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} &middot; 
                          <span className={blog.status === 'ERROR' ? 'text-red-500 ml-1 font-bold' : 'text-orange-500 ml-1'}>
                            {blog.status}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                  {!editingId && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(blog.id);
                          setEditTopic(blog.topic);
                        }}
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
                  )}
                </div>
              </li>
            ))}
            <li className="pt-2 text-center">
              <button 
                onClick={onViewFullHistory} 
                className="w-full text-xs font-semibold text-orange-500 hover:text-white bg-orange-50 hover:bg-orange-500 px-3 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                See full history
              </button>
            </li>
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
