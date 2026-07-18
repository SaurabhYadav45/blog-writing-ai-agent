import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Check, Download, History } from 'lucide-react';

import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { UserProfileDropdown } from './UserProfileDropdown';
import { updateBlogContent, regenerateBlogSelection, getBlogs, deleteBlog, updateBlogTitle } from '../services/blogs';
import { ModelDropdown } from './ModelDropdown';
import { LogsTab } from './workspace-tabs/LogsTab';
import { PlanTab } from './workspace-tabs/PlanTab';
import { EvidenceTab } from './workspace-tabs/EvidenceTab';
import { MetricsTab } from './workspace-tabs/MetricsTab';
import { HistoryTab } from './workspace-tabs/HistoryTab';
import { EditorTab } from './workspace-tabs/EditorTab';
import { PreviewTab } from './workspace-tabs/PreviewTab';

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
  onDeleteBlog?: (id: number) => void;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({ 
  isGenerating,
  selectedModel,
  onModelSelect,
  streamMessage, logs, plan, evidence, metrics, latency, finalMarkdown, seoMetadata,
  onSelectBlog,
  selectedBlogId,
  activeTab,
  setActiveTab,
  onDeleteBlog
}: MainWorkspaceProps) => {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const [historyBlogs, setHistoryBlogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // New States for Editor and Regenerate Feature
  const [editableMarkdown, setEditableMarkdown] = useState(finalMarkdown || "");
  const [showRegeneratePopup, setShowRegeneratePopup] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionIndices, setSelectionIndices] = useState({ start: 0, end: 0 });
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");

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
      await updateBlogContent(selectedBlogId, editableMarkdown, token || '');
      setIsDirty(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const handlePublish = async (platform: string) => {
    if (!selectedBlogId) return;
    setIsPublishing(true);
    try {
      const { publishBlog } = await import('../services/blogs');
      const res = await publishBlog(selectedBlogId, platform, token || '');
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
        alert(`Published successfully to ${platform}`);
      } else {
        const err = await res.json();
        alert('Publish failed: ' + err.detail);
      }
    } catch (err: any) {
      alert('Publish failed: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const [isPromoting, setIsPromoting] = useState(false);
  const handlePromote = async (platform: string) => {
    if (!selectedBlogId || platform !== 'linkedin') return;
    setIsPromoting(true);
    try {
      const { promoteOnLinkedIn } = await import('../services/blogs');
      const res = await promoteOnLinkedIn(selectedBlogId, token || '');
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully promoted on LinkedIn!\n\nPost:\n${data.generated_post}`);
      } else {
        const err = await res.json();
        alert('Promotion failed: ' + err.detail);
      }
    } catch (err: any) {
      alert('Promotion failed: ' + err.message);
    } finally {
      setIsPromoting(false);
    }
  };

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
      
      // Estimate cursor position or simply place popup centrally relative to textarea
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
      
      const res = await regenerateBlogSelection(selectedBlogId, {
        selected_text: selectedText,
        prompt: regeneratePrompt,
        model_name: selectedModel,
        full_text: contextText || editableMarkdown
      }, token || '');
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
      getBlogs(token || '')
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
      await deleteBlog(blogToDelete, token || '');
      setHistoryBlogs(prev => prev.filter(b => b.id !== blogToDelete));
      if (onDeleteBlog) onDeleteBlog(blogToDelete);
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
      await updateBlogTitle(id, newTopic, token || '');
      setHistoryBlogs(prev => prev.map(b => b.id === id ? { ...b, topic: newTopic } : b));
    } catch (err) {
      console.error(err);
    }
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
      return <MetricsTab metrics={metrics} latency={latency} isGenerating={isGenerating} />;
    }

    if (activeTab === 'Logs') {
      return <LogsTab logs={logs} isGenerating={isGenerating} />;
    }

    if (activeTab === 'Plan') {
      return <PlanTab plan={plan} />;
    }

    if (activeTab === 'Evidence') {
      return <EvidenceTab evidence={evidence} />;
    }

    if (activeTab === 'History') {
      return (
        <HistoryTab
          loadingHistory={loadingHistory}
          historyBlogs={historyBlogs}
          onSelectBlog={onSelectBlog}
          setActiveTab={setActiveTab}
          handleRenameHistory={handleRenameHistory}
          handleDeleteClick={handleDeleteClick}
        />
      );
    }

    // Handle Editor Tab
    if (activeTab === 'Editor') {
      return (
        <EditorTab
          editableMarkdown={editableMarkdown}
          handleEditorChange={handleEditorChange}
          handleTextSelection={handleTextSelection}
          setShowRegeneratePopup={setShowRegeneratePopup}
          isDirty={isDirty}
          isSaving={isSaving}
          handleSave={handleSave}
        />
      );
    }

    // Default to Preview Tab
    return (
      <PreviewTab
        editableMarkdown={editableMarkdown}
        finalMarkdown={finalMarkdown}
        seoMetadata={seoMetadata}
        isGenerating={isGenerating}
        streamMessage={streamMessage}
        isTocCollapsed={isTocCollapsed}
        setIsTocCollapsed={setIsTocCollapsed}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        onPromote={handlePromote}
        isPromoting={isPromoting}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Narrow Header */}
      <header className="glass-panel border-b-0 rounded-b-xl md:rounded-b-2xl pt-4 md:pt-6 pb-4 md:pb-5 px-4 md:px-10 flex-shrink-0 relative z-10 shadow-sm">
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
            {isGenerating && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-500 animate-pulse bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
              </span>
            )}
            
            {/* Model Switcher UI */}
            <ModelDropdown selectedModel={selectedModel} onModelSelect={onModelSelect} />

            {/* User Profile Dropdown */}
            <UserProfileDropdown />
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
                <div className="mb-3 p-2 bg-slate-50 border border-slate-100 rounded-md text-xs text-slate-500 italic max-h-20 overflow-y-auto break-words whitespace-pre-wrap font-mono">
                  "{selectedText.length > 200 ? selectedText.substring(0, 200) + '...' : selectedText}"
                </div>
                <textarea 
                  value={regeneratePrompt} 
                  onChange={(e) => setRegeneratePrompt(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRegenerate(); } }}
                  placeholder="e.g. Make this sound more professional" 
                  className="w-full text-sm border border-slate-200 p-2.5 mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none break-words" 
                  rows={2}
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
