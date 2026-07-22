import React from 'react';
import { Loader2, Edit2, Trash2 } from 'lucide-react';

export interface HistoryTabProps {
  loadingHistory: boolean;
  historyBlogs: any[];
  onSelectBlog?: (id: number) => void;
  setActiveTab: (tab: string) => void;
  handleRenameHistory: (id: number, newTopic: string) => void;
  handleDeleteClick: (id: number, e: React.MouseEvent) => void;
  loadMoreHistory?: () => void;
  hasMoreHistory?: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  loadingHistory,
  historyBlogs,
  onSelectBlog,
  setActiveTab,
  handleRenameHistory,
  handleDeleteClick,
  loadMoreHistory,
  hasMoreHistory
}) => {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editTopic, setEditTopic] = React.useState<string>("");

  const submitRename = (id: number) => {
    if (editingId === id) {
      handleRenameHistory(id, editTopic);
      setEditingId(null);
    }
  };

  return (
    <div className="h-full bg-slate-50/50 rounded-xl p-4 md:p-8 overflow-y-auto shadow-sm border border-slate-200">
      <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Blog Generation History</h2>
      
      {loadingHistory ? (
        <div className="w-full flex flex-col items-center justify-center h-64 text-slate-400 space-y-4 text-center px-4">
           <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 opacity-20 animate-spin" />
          </div>
          <p className="font-medium">Loading history...</p>
        </div>
      ) : historyBlogs.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
          <p className="font-medium">No blogs generated yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyBlogs.map(blog => (
            <div key={blog.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md hover:border-orange-200 transition-all">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${blog.status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {blog.status}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">ID: {blog.id}</span>
                </div>
                <div className="min-h-10 mb-1">
                  {editingId === blog.id ? (
                    <input 
                      type="text"
                      value={editTopic}
                      autoFocus
                      onChange={(e) => setEditTopic(e.target.value)}
                      onBlur={() => submitRename(blog.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(blog.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full text-lg font-bold text-slate-800 bg-white border border-orange-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  ) : (
                    <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-2" title={blog.topic}>
                      {blog.topic}
                    </h3>
                  )}
                </div>
                <div className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                  <span>{new Date(blog.created_at + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  &middot;
                  <span>{new Date(blog.created_at + 'Z').toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (onSelectBlog) onSelectBlog(blog.id);
                    setActiveTab('Preview');
                  }}
                  className="flex-1 cursor-pointer py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                >
                  Load Blog
                </button>
                <button 
                  onClick={() => {
                    setEditingId(blog.id);
                    setEditTopic(blog.topic);
                  }}
                  className="p-2 cursor-pointer bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  title="Rename"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(blog.id, e)}
                  className="p-2 cursor-pointer bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {hasMoreHistory && historyBlogs.length > 0 && !loadingHistory && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={loadMoreHistory}
            className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold hover:text-orange-600 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            Load More Blogs
          </button>
        </div>
      )}
    </div>
  );
};
