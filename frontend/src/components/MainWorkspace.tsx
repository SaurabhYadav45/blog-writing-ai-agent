import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Copy, Check, Download, History, Sparkles, Trash2, Edit2, Save, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MermaidDiagram } from './MermaidDiagram';
import { TableOfContents } from './TableOfContents';
import { extractToc } from '../utils/toc';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../context/AuthContext';

interface MainWorkspaceProps {
  isGenerating: boolean;
  selectedModel: string;
  onModelSelect: (model: string) => void;
  streamStatus: string;
  streamMessage: string;
  logs: string[];
  plan: any;
  evidence: any[];
  mode: string;
  metrics: any[];
  latency: number;
  finalMarkdown: string | null;
  seoMetadata?: {
    meta_description?: string;
    slug?: string;
    focus_keywords?: string[];
  } | null;
  onSelectBlog?: (id: number) => void;
  selectedBlogId?: number | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({ 
  isGenerating,
  selectedModel,
  onModelSelect,
  streamStatus, 
  streamMessage, logs, plan, evidence, mode, metrics, latency, finalMarkdown, seoMetadata,
  onSelectBlog,
  selectedBlogId,
  activeTab,
  setActiveTab
}: MainWorkspaceProps) => {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const [historyBlogs, setHistoryBlogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // New States for Editor and Regenerate Feature
  const [editableMarkdown, setEditableMarkdown] = useState(finalMarkdown || "");
  const [showRegeneratePopup, setShowRegeneratePopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectionIndices, setSelectionIndices] = useState({ start: 0, end: 0 });
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);

  useEffect(() => {
    setEditableMarkdown(finalMarkdown || "");
    setIsDirty(false);
  }, [finalMarkdown]);

  const handleEditorChange = (e: any) => {
    setEditableMarkdown(e.target.value);
    setIsDirty(e.target.value !== (finalMarkdown || ""));
  };

  const handleSave = async () => {
    if (!selectedBlogId) return;
    setIsSaving(true);
    try {
      await fetch(`http://localhost:8000/api/blogs/${selectedBlogId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markdown_content: editableMarkdown })
      });
      setIsDirty(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && activeTab === 'Editor') {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editableMarkdown, activeTab]);

  const handleTextSelection = (e: any) => {
    const textarea = e.target;
    if (textarea.selectionStart !== textarea.selectionEnd) {
      const text = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      // Reject empty or whitespace-only selections
      if (!text.trim()) {
        setSelectedText("");
        setSelectionIndices({ start: 0, end: 0 });
        setShowRegeneratePopup(false);
        return;
      }
      setSelectedText(text);
      setSelectionIndices({ start: textarea.selectionStart, end: textarea.selectionEnd });
      
      const rect = textarea.getBoundingClientRect();
      // Estimate cursor position or simply place popup centrally relative to textarea
      setPopupPos({ x: rect.left + 50, y: rect.top + 50 });
      setShowRegeneratePopup(true);
      setRegenerateError("");
    } else {
      setSelectedText("");
      setSelectionIndices({ start: 0, end: 0 });
      setShowRegeneratePopup(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedText || !regeneratePrompt || !selectedBlogId) return;
    setRegenerating(true);
    
    try {
      // Extract a smaller context window (500 chars before and after) to save tokens
      const startIdx = editableMarkdown.indexOf(selectedText);
      let contextText = "";
      if (startIdx !== -1) {
        const endIdx = startIdx + selectedText.length;
        const contextStart = Math.max(0, startIdx - 500);
        const contextEnd = Math.min(editableMarkdown.length, endIdx + 500);
        contextText = editableMarkdown.substring(contextStart, contextEnd);
      }
      
      const res = await fetch(`http://localhost:8000/api/blogs/${selectedBlogId}/regenerate-selection`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          selected_text: selectedText,
          prompt: regeneratePrompt,
          model_name: selectedModel,
          full_text: contextText || editableMarkdown
        })
      });
      const data = await res.json();
      if (data.new_text) {
        // Safe splice using precise selection indices instead of generic string.replace
        setEditableMarkdown((prev) => 
          prev.substring(0, selectionIndices.start) + 
          data.new_text + 
          prev.substring(selectionIndices.end)
        );
        closeRegeneratePopup();
      } else {
        setRegenerateError(data.detail || "Failed to regenerate text. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setRegenerateError("A network error occurred. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const closeRegeneratePopup = () => {
    setShowRegeneratePopup(false);
    setSelectedText("");
    setRegeneratePrompt("");
    setRegenerateError("");
    setSelectionIndices({ start: 0, end: 0 });
  };
  
  const tabs = ['Preview', 'Editor', 'Plan', 'Evidence', 'Logs', 'Metrics'];

  useEffect(() => {
    if (activeTab === 'History') {
      setLoadingHistory(true);
      fetch('http://localhost:8000/api/blogs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistoryBlogs(data);
          } else {
            console.error("Expected array but got:", data);
            setHistoryBlogs([]);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab]);

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
      setHistoryBlogs(prev => prev.filter(b => b.id !== blogToDelete));
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

  const handleRenameHistory = async (id: number, currentTopic: string, e: React.MouseEvent) => {
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
      setHistoryBlogs(prev => prev.map(b => b.id === id ? { ...b, topic: newTopic } : b));
    } catch (err) {
      console.error(err);
    }
  };

  const calculateCost = (model: string, input: number, output: number) => {
    let cost = 0;
    const m = model.toLowerCase();
    if (m.includes('claude')) {
      cost = (input / 1000000) * 3.0 + (output / 1000000) * 15.0;
    } else if (m.includes('gemini')) {
      cost = (input / 1000000) * 1.25 + (output / 1000000) * 5.0; // gemini-1.5-pro approx
    } else if (m.includes('gpt-4o')) {
      cost = (input / 1000000) * 2.5 + (output / 1000000) * 10.0;
    } else if (m.includes('gpt-image')) {
      return 0.04; // $0.04 per standard gpt-image-1
    }
    return cost;
  };

  const handleCopy = () => {
    if (editableMarkdown) {
      navigator.clipboard.writeText(editableMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (editableMarkdown) {
      const blob = new Blob([editableMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'blog_post.md';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'Metrics') {
      const safeMetrics = Array.isArray(metrics) ? metrics : [];
      const totalInput = safeMetrics.reduce((acc, m) => acc + (m.input_tokens || 0), 0);
      const totalOutput = safeMetrics.reduce((acc, m) => acc + (m.output_tokens || 0), 0);
      const totalImages = safeMetrics.reduce((acc, m) => acc + (m.images_generated || 0), 0);
      
      let totalCost = 0;
      safeMetrics.forEach(m => {
        if (m.images_generated) {
          totalCost += m.images_generated * 0.04;
        } else {
          totalCost += calculateCost(m.model_name || '', m.input_tokens || 0, m.output_tokens || 0);
        }
      });

      return (
        <div className="h-full bg-slate-50/50 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Tokens</span>
              <span className="text-2xl font-bold text-slate-800">{(totalInput + totalOutput).toLocaleString()}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Cost</span>
              <span className="text-2xl font-bold text-green-600">${totalCost.toFixed(4)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Images Generated</span>
              <span className="text-2xl font-bold text-blue-600">{totalImages}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Latency</span>
              <span className="text-2xl font-bold text-orange-500">{latency > 0 ? `${latency}s` : 'Live...'}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-6">Execution Timeline</h3>
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
            {safeMetrics.map((m, idx) => {
              const nodeCost = m.images_generated 
                ? m.images_generated * 0.04 
                : calculateCost(m.model_name || '', m.input_tokens || 0, m.output_tokens || 0);
                
              return (
                <div key={idx} className="relative pl-6 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-orange-400"></div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800">{m.node}</h4>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {m.model_name}
                      </span>
                    </div>
                    {m.images_generated ? (
                      <p className="text-sm text-slate-600">Images Generated: <span className="font-medium text-slate-800">{m.images_generated}</span></p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="text-sm">
                          <span className="text-slate-500">Input: </span>
                          <span className="font-medium">{m.input_tokens?.toLocaleString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-500">Output: </span>
                          <span className="font-medium">{m.output_tokens?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 text-right">
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        +${nodeCost.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isGenerating && (
              <div className="relative pl-6 animate-pulse">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-slate-300"></div>
                <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 text-slate-400 text-sm italic">
                  Processing next node...
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'Logs') {
      return (
        <div className="h-full bg-slate-900 rounded-xl p-4 md:p-6 font-mono text-xs md:text-sm text-green-400 overflow-y-auto shadow-inner border border-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Waiting for agent to start...</div>
          ) : (
            <ul className="space-y-2">
              {logs.map((log, i) => (
                <li key={i} className="opacity-90 leading-relaxed border-b border-slate-800/50 pb-2 mb-2 last:border-0">{log}</li>
              ))}
              {isGenerating && (
                <li className="flex items-center gap-2 text-orange-400 animate-pulse mt-4">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  Agent is thinking...
                </li>
              )}
            </ul>
          )}
        </div>
      );
    }

    if (activeTab === 'Plan') {
      return (
        <div className="h-full bg-white/50 rounded-xl p-4 md:p-8 overflow-y-auto shadow-sm border border-orange-100">
          {plan ? (
            <div className="prose prose-sm md:prose-base prose-orange max-w-none">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Execution Plan</h2>
              <div className="grid gap-4">
                {plan.tasks?.map((task: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-orange-100/50 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-slate-700 m-0">Section {idx + 1}: {task.title}</h3>
                    <p className="text-sm text-slate-500 mt-2 mb-3 leading-relaxed">{task.goal}</p>
                    {task.bullets && task.bullets.length > 0 && (
                      <ul className="list-disc pl-5 mt-3 text-sm text-slate-600 space-y-1">
                        {task.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-medium">Plan will appear here once the orchestrator finishes...</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Evidence') {
      return (
        <div className="h-full bg-white/50 rounded-xl p-4 md:p-8 overflow-y-auto shadow-sm border border-orange-100">
          {evidence && evidence.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Research Evidence</h2>
              {evidence.map((ev, i) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-orange-200 transition-colors">
                  <h4 className="font-bold text-slate-700 text-lg mb-2">{ev.title || ev.url}</h4>
                  <a href={ev.url} target="_blank" rel="noreferrer" className="text-sm text-orange-500 hover:text-orange-600 underline truncate block mb-3 font-medium">
                    {ev.url}
                  </a>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">{ev.content || ev.snippet}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-medium">Evidence will appear here after research node completes...</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'History') {
      return (
        <div className="h-full bg-slate-50/50 rounded-xl p-4 md:p-8 overflow-y-auto shadow-sm border border-slate-200">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Blog Generation History</h2>
          
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 opacity-20 animate-spin" />
              </div>
              <p className="font-medium">Loading history...</p>
            </div>
          ) : historyBlogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p className="font-medium">No blogs generated yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyBlogs.map(blog => (
                <div key={blog.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md hover:border-orange-200 transition-all">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${blog.status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {blog.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">ID: {blog.id}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg leading-snug mb-2 line-clamp-2" title={blog.topic}>
                      {blog.topic}
                    </h3>
                    <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                      <span>{new Date(blog.created_at + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      &middot;
                      <span>{new Date(blog.created_at + 'Z').toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex items-center gap-2">
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
                      onClick={(e) => handleRenameHistory(blog.id, blog.topic, e)}
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
        </div>
      );
    }

    // Handle Editor Tab
    if (activeTab === 'Editor') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          {editableMarkdown ? (
            <div className="w-full flex flex-col relative">
              <div className="bg-slate-100 p-2 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center sticky top-0 z-10">
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-2">Raw Markdown Editor</span>
                 <div className="flex items-center gap-3">
                   <span className="text-[11px] font-medium text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-md border border-amber-200 shadow-sm flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                     Select text to Regenerate
                   </span>
                   <button 
                     onClick={() => setShowRegeneratePopup(true)}
                     className="cursor-pointer flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-white text-orange-600 rounded-md border border-orange-200 hover:border-orange-400 hover:bg-orange-50 shadow-sm transition-colors"
                   >
                     <Sparkles className="w-3 h-3" />
                     Regenerate
                   </button>
                   <button 
                     onClick={handleSave}
                     disabled={!isDirty || isSaving}
                     className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md shadow-sm transition-colors ${
                       isDirty 
                         ? 'bg-blue-600 text-white hover:bg-blue-700' 
                         : 'bg-white text-slate-400 border border-slate-200 disabled:cursor-not-allowed'
                     }`}
                   >
                     <Save className="w-3 h-3" />
                     {isSaving ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
              </div>
              <textarea 
                ref={textareaRef}
                className="w-full p-6 bg-slate-900 text-slate-200 font-mono text-sm rounded-b-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none leading-relaxed overflow-hidden"
                style={{ minHeight: '70vh' }}
                value={editableMarkdown}
                onChange={handleEditorChange}
                onSelect={handleTextSelection}
                placeholder="Blog markdown content..."
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                 <img src="/icon.png" alt="icon" className="w-10 h-10 opacity-30 grayscale" />
              </div>
              <p className="font-medium text-lg">No content loaded</p>
              <p className="text-sm">Select a topic from the sidebar or generate a new blog.</p>
            </div>
          )}
        </div>
      );
    }

    // Default to Preview Tab
    return (
      <div className="bg-white rounded-xl p-4 md:py-10 md:pl-10 md:pr-4 shadow-sm border border-slate-100">

        {editableMarkdown ? (
          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto items-start">
            <div className="w-full flex-1 min-w-0 transition-all duration-300">
              <article className="prose prose-sm md:prose-base lg:prose-lg prose-slate max-w-none prose-headings:font-extrabold prose-a:text-orange-500 prose-img:rounded-xl prose-img:shadow-md prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-td:p-3 prose-th:p-3 prose-tr:border-b prose-tr:border-slate-100 prose-blockquote:border-l-4 prose-blockquote:border-orange-400 prose-blockquote:bg-orange-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]} 
                  rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
                  components={{
                    h2({ node, children, ...props }: any) {
                      const text = String(children).replace(/[*_~`]/g, '');
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      return <h2 id={id || undefined} className="scroll-mt-24" {...props}>{children}</h2>;
                    },
                    h3({ node, children, ...props }: any) {
                      const text = String(children).replace(/[*_~`]/g, '');
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      return <h3 id={id || undefined} className="scroll-mt-24" {...props}>{children}</h3>;
                    },
                    h4({ node, children, ...props }: any) {
                      const text = String(children).replace(/[*_~`]/g, '');
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      return <h4 id={id || undefined} className="scroll-mt-24" {...props}>{children}</h4>;
                    },
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (!inline && match && match[1] === 'mermaid') {
                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                      }
                      
                      if (!inline && match) {
                        return (
                          <div className="rounded-xl overflow-hidden my-6 border border-slate-700 shadow-xl bg-[#1e1e1e]">
                            <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-slate-700/50">
                              <div className="flex space-x-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                              </div>
                              <span className="ml-4 text-xs font-medium text-slate-400 font-mono lowercase">{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus as any}
                              language={match[1]}
                              PreTag="div"
                              className="!m-0 text-sm font-mono !bg-transparent custom-scrollbar"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      
                      return (
                        <code className={`${className} bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md text-sm font-semibold`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    iframe({ node, ...props }: any) {
                      return (
                        <div className="my-8 aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-slate-200">
                          <iframe 
                            {...props} 
                            className="w-full h-full"
                            loading="lazy"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      );
                    }
                  }}
                >
                  {editableMarkdown
                    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
                    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
                    .replace(/^>\s*\[!NOTE\]/gm, '> 🔵 **Note:**')
                    .replace(/^>\s*\[!TIP\]/gm, '> 💡 **Tip:**')
                    .replace(/^>\s*\[!IMPORTANT\]/gm, '> ❗ **Important:**')
                    .replace(/^>\s*\[!WARNING\]/gm, '> ⚠️ **Warning:**')
                    .replace(/^>\s*\[!CAUTION\]/gm, '> 🛑 **Caution:**')}
                </ReactMarkdown>
              </article>

              {finalMarkdown && seoMetadata && Object.keys(seoMetadata).length > 0 && (
                <div className="mt-12 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100/50 shadow-sm">
                  <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    SEO Metadata Generated
                  </h3>
                  <div className="grid gap-3">
                    {seoMetadata.slug && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700">Slug: </span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded text-indigo-700 border border-indigo-100">/{seoMetadata.slug}</span>
                      </div>
                    )}
                    {seoMetadata.meta_description && (
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700">Description: </span>
                        <span className="text-slate-600">{seoMetadata.meta_description}</span>
                      </div>
                    )}
                    {seoMetadata.focus_keywords && seoMetadata.focus_keywords.length > 0 && (
                      <div className="text-sm flex gap-2 items-start">
                        <span className="font-semibold text-slate-700 mt-0.5">Keywords: </span>
                        <div className="flex flex-wrap gap-1.5">
                          {seoMetadata.focus_keywords.map((kw, i) => (
                            <span key={i} className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={`shrink-0 transition-all duration-300 sticky top-4 hidden lg:block ${isTocCollapsed ? 'w-12' : 'w-64'}`}>
              <TableOfContents 
                toc={extractToc(editableMarkdown)} 
                isCollapsed={isTocCollapsed} 
                onToggle={() => setIsTocCollapsed(!isTocCollapsed)} 
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 min-h-[400px]">
            {isGenerating ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
                <p className="font-medium text-slate-500 text-lg">{streamMessage || "Drafting in progress..."}</p>
                <p className="text-sm text-slate-400">Check the Logs tab to see internal agent thoughts.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
                   <img src="/icon.png" alt="icon" className="w-10 h-10 opacity-30 grayscale" />
                </div>
                <p className="font-medium text-lg">No content loaded</p>
                <p className="text-sm">Select a topic from the sidebar or generate a new blog.</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Narrow Header */}
      <header className="glass-panel border-b-0 rounded-b-xl md:rounded-b-2xl pt-4 md:pt-6 pb-4 md:pb-5 px-4 md:px-10 flex-shrink-0 relative z-10 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -mr-10 md:-mr-20 -mt-10 md:-mt-20 w-32 md:w-48 h-32 md:h-48 bg-orange-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600">
              BlogFusion <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-400">Workspace</span>
            </h1>
            <p className="text-slate-500 mt-1 text-xs font-medium">
              Live AI drafting, research, and planning.
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold bg-white text-orange-600 rounded-lg border border-orange-200 hover:border-orange-400 hover:bg-orange-50 shadow-sm transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            {isGenerating && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-500 animate-pulse bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
              </span>
            )}
            
            {/* Model Switcher UI */}
            <div className="flex items-center gap-1 bg-white/60 p-1 rounded-lg border border-slate-200/60 shadow-sm">
              {['GPT-5', 'Claude', 'Gemini'].map(model => (
                <button 
                  key={model}
                  onClick={() => onModelSelect(model)}
                  className={`cursor-pointer px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    selectedModel === model 
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto px-4 md:px-10 pb-6 md:pb-10">
        
        {/* Tabs and Actions Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6 mt-4 md:mt-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all shadow-sm ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-orange-500/30' 
                    : 'bg-white/70 text-slate-600 hover:bg-white hover:text-orange-500 border border-transparent hover:border-orange-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Export Actions & History */}
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
            <button 
              onClick={() => setActiveTab('History')}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md border shadow-sm transition-colors ${
                activeTab === 'History'
                  ? 'bg-orange-50 text-orange-600 border-orange-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History Grid
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={handleCopy}
              disabled={!editableMarkdown}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white text-slate-600 rounded-md border border-slate-200 hover:border-orange-300 hover:text-orange-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Markdown'}
            </button>

            <button 
              onClick={handleDownload}
              disabled={!editableMarkdown}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-orange-500 text-white rounded-md border border-transparent hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-8 grow shrink-0 flex flex-col min-h-[500px]">
          {renderTabContent()}
        </div>
      </div>

      {/* Global Regenerate Modal (Outside all transforms/filters) */}
      {showRegeneratePopup && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9998]" onClick={closeRegeneratePopup}></div>
          <div className="fixed bg-white p-4 shadow-2xl border border-orange-200 rounded-xl z-[9999]" style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px'}}>
            <p className="text-xs font-bold text-orange-600 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Regenerate Selection
            </p>
            {selectedText ? (
              <>
                <input 
                  type="text" 
                  value={regeneratePrompt} 
                  onChange={(e) => setRegeneratePrompt(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegenerate(); }}
                  placeholder="e.g. Make this sound more professional" 
                  className="w-full text-sm border border-slate-200 p-2.5 mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" 
                />
                {regenerateError && (
                  <p className="text-xs text-red-500 font-medium mb-3 p-2 bg-red-50 rounded-lg border border-red-100">
                    {regenerateError}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    "Make it shorter", "Make it longer", "More professional", 
                    "Fix grammar", "Simplify this", "Make it punchier", 
                    "Change to casual tone", "Expand with examples", "Make it more engaging"
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => setRegeneratePrompt(prompt)}
                      className="px-2 py-1 text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-100 rounded hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                   <button onClick={handleRegenerate} disabled={regenerating || !regeneratePrompt.trim()} className="cursor-pointer bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium text-xs px-4 py-2 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                     {regenerating ? 'Regenerating...' : 'Regenerate'}
                   </button>
                   <button onClick={closeRegeneratePopup} className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs px-4 py-2 rounded-lg transition-colors">
                     Cancel
                   </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-4">Please highlight a section of text in the editor below to use the AI Regenerate feature.</p>
                <button onClick={closeRegeneratePopup} className="cursor-pointer w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs px-4 py-2 rounded-lg transition-colors">
                  Got it!
                </button>
              </>
            )}
          </div>
        </>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Delete Blog from History"
        message="Are you sure you want to permanently delete this blog? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
