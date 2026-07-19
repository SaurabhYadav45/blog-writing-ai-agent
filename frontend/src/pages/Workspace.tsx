/**
 * Creator Workspace Page.
 * Coordinates state for the multi-agent blog generator:
 * - Listens for model selection and config settings
 * - Triggers asynchronous REST requests to create a new pending blog
 * - Opens an EventSource (SSE) stream using URL query parameters to pull real-time generation outputs
 * - Houses and shares reactive data (outlines, evidence items, logs, markdown draft, SEO metadata)
 * - Renders a responsive mobile header, Sidebar control menu, and the Main Workspace interface.
 */

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MainWorkspace } from '../components/MainWorkspace';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { getBlogById, generateBlog, getStreamUrl } from '../services/blogs';
import { MODEL_NAMES } from '../config/models';

export const Workspace = () => {
  // Currently viewed blog ID
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  
  // Mobile responsive toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Active workflow variables
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('GPT');
  const [streamStatus, setStreamStatus] = useState<string>('pending');
  const [streamMessage, setStreamMessage] = useState<string>('');
  const [clearSignal, setClearSignal] = useState<number>(0);
  
  // Data packets received from LLM agents
  const [mode, setMode] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [finalMarkdown, setFinalMarkdown] = useState<string | null>(null);
  const [seoMetadata, setSeoMetadata] = useState<any>(null);
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('Preview');

  const { token } = useAuth();
  const location = useLocation();

  // Listen to navigation state for auto-loading specific blogs or pre-selecting tabs
  useEffect(() => {
    if (location.state?.selectedBlogId) {
      loadBlog(location.state.selectedBlogId);
      // Clear route state to prevent infinite refresh reload loop
      window.history.replaceState({}, document.title);
    } else if (location.state?.tab) {
      setActiveTab(location.state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleDeleteBlog = (id: number) => {
    if (selectedBlogId === id) {
      setSelectedBlogId(null);
      setFinalMarkdown(null);
      setPlan(null);
      setEvidence([]);
      setLogs([]);
      setMetrics([]);
      setSeoMetadata(null);
      setStreamStatus('idle');
      setStreamMessage('');
      setActiveTab('Preview');
    }
  };

  /**
   * Load metadata and content of a specific blog post by ID.
   * Fetches data from the /blogs/{id} endpoint and populates React state.
   */
  const loadBlog = async (id: number, isLiveCompletion: boolean = false) => {
    setIsMobileMenuOpen(false); // Close sidebar drawer on mobile
    setSelectedBlogId(id);
    setIsGenerating(false);
    setActiveTab('Preview');
    
    // Clear previous blog details if this is a fresh manual load rather than SSE completion hook
    if (!isLiveCompletion) {
      setPlan(null);
      setEvidence([]);
      setMetrics([]);
      setLatency(0);
      setLogs([`Loaded historic blog ID: ${id}`]);
      setMode('');
      setSeoMetadata(null);
    }
    
    try {
      const response = await getBlogById(id, token || '');
      const data = await response.json();
      setFinalMarkdown(data.markdown_content || null);
      
      const backendStatusMap: Record<string, string> = {
        "COMPLETED": "complete",
        "ERROR": "error",
        "PENDING": "pending",
        "GENERATING": "generating"
      };
      const mappedStatus = backendStatusMap[data.status] || 'complete';
      setStreamStatus(mappedStatus);

      if (data.status === 'ERROR') {
        setStreamMessage('Generation failed or was interrupted.');
      } else if (data.status === 'PENDING') {
        setStreamMessage('Generation is pending.');
      } else {
        setStreamMessage('');
      }
      if (!isLiveCompletion) {
        setMode(data.mode);
        if (data.plan) setPlan(data.plan);
        if (data.evidence) setEvidence(data.evidence);
        if (data.metrics) setMetrics(data.metrics);
        if (data.latency) setLatency(data.latency);
        if (data.logs && data.logs.length > 0) setLogs(data.logs);
        if (data.seo_metadata) setSeoMetadata(data.seo_metadata);
      }
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      setFinalMarkdown("Failed to load the blog post.");
    }
  };

  /**
   * Post configuration details to /blogs/generate to queue a new generation task.
   * Then, opens a Server-Sent Events (EventSource) query connection to stream live updates
   * as worker agents execute.
   */
  const handleGenerate = async (topic: string, tone: string, audience: string, depth: string, referenceUrls: string) => {
    setIsMobileMenuOpen(false);
    setIsGenerating(true);
    setFinalMarkdown(null);
    setStreamStatus('pending');
    setStreamMessage('Initializing...');
    setActiveTab('Preview');
    setPlan(null);
    setEvidence([]);
    setLogs(['Sending request to start agent workflow...']);
    setMode('');
    setMetrics([]);
    setLatency(0);
    setSeoMetadata(null);

    try {
      // 1. Post request to initialize the generation record
      const response = await generateBlog({
        topic,
        tone,
        audience,
        depth,
        reference_urls: referenceUrls,
        model_name: selectedModel
      }, token || '');
      
      if (!response.ok) throw new Error("Failed to start generation");
      
      const { blog_id } = await response.json();
      setSelectedBlogId(blog_id);
      setLogs(prev => [...prev, `Created blog record #${blog_id}. Opening SSE stream...`]);

      // 2. Open SSE stream passing authorization token in URL query parameter
      const eventSource = new EventSource(getStreamUrl(blog_id, token || ''));
      
      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        setStreamStatus(data.status);
        setStreamMessage(data.message);
        
        setLogs(prev => [...prev, `[${data.status.toUpperCase()}] ${data.message}`]);
        
        // Populate reactive graph state
        if (data.mode) setMode(data.mode);
        if (data.plan) setPlan(data.plan);
        if (data.evidence) setEvidence(data.evidence);
        if (data.metrics) setMetrics(data.metrics);
        if (data.latency) setLatency(data.latency);
        if (data.seo_metadata) setSeoMetadata(data.seo_metadata);
        
        // Handle stream end bounds
        if (data.status === 'complete' || data.status === 'error') {
          eventSource.close();
          setIsGenerating(false);
          
          if (data.status === 'complete') {
            setLogs(prev => [...prev, `Stream complete. Fetching final markdown...`]);
            loadBlog(blog_id, true);
            setClearSignal(prev => prev + 1); // Trigger form config clear
          }
        }
      };

      eventSource.onerror = () => {
        setStreamStatus('error');
        setStreamMessage('Connection lost. Please check the backend.');
        setLogs(prev => [...prev, `ERROR: SSE Connection lost.`]);
        eventSource.close();
        setIsGenerating(false);
      };

    } catch (error: any) {
      console.error(error);
      setIsGenerating(false);
      setStreamStatus('error');
      setStreamMessage('Failed to initialize blog generation.');
      setLogs(prev => [...prev, `ERROR: ${error.message}`]);
    }
  };

  const handleResume = async (blogId: number) => {
    setIsMobileMenuOpen(false);
    setIsGenerating(true);
    setStreamStatus('generating');
    setStreamMessage('Resuming generation...');
    setActiveTab('Preview');

    try {
      const eventSource = new EventSource(getStreamUrl(blogId, token || ''));
      
      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        setStreamStatus(data.status);
        setStreamMessage(data.message);
        
        setLogs(prev => [...prev, `[${data.status.toUpperCase()}] ${data.message}`]);
        
        if (data.mode) setMode(data.mode);
        if (data.plan) setPlan(data.plan);
        if (data.evidence) setEvidence(data.evidence);
        if (data.metrics) setMetrics(data.metrics);
        if (data.latency) setLatency(data.latency);
        if (data.seo_metadata) setSeoMetadata(data.seo_metadata);
        
        if (data.status === 'complete' || data.status === 'error') {
          eventSource.close();
          setIsGenerating(false);
          
          if (data.status === 'complete') {
            setLogs(prev => [...prev, `Stream complete. Fetching final markdown...`]);
            loadBlog(blogId, true);
            setClearSignal(prev => prev + 1);
          }
        }
      };

      eventSource.onerror = () => {
        setStreamStatus('error');
        setStreamMessage('Connection lost. Please check the backend.');
        setLogs(prev => [...prev, `ERROR: SSE Connection lost.`]);
        eventSource.close();
        setIsGenerating(false);
      };

    } catch (error: any) {
      console.error(error);
      setIsGenerating(false);
      setStreamStatus('error');
      setStreamMessage('Failed to resume blog generation.');
      setLogs(prev => [...prev, `ERROR: ${error.message}`]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-orange-50 relative workspace-font">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50">
         <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-sm">
              <span className="text-white font-bold text-xs">BF</span>
            </div>
            <span className="font-extrabold text-slate-800 tracking-tight">BlogFusion</span>
         </div>
         <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
             className="p-2 bg-white rounded-md shadow-sm border border-orange-100 text-orange-600 hover:bg-orange-50 transition-colors"
           >
             {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
         </div>
      </div>

      {/* Sidebar Navigation Panel */}
      <div className={`
        ${isMobileMenuOpen ? 'absolute inset-0 top-[73px] z-40 bg-white/95 backdrop-blur-3xl flex flex-col' : 'hidden'} 
        md:flex md:flex-col md:relative md:bg-transparent md:h-screen w-full md:w-80
      `}>
        <div className="flex-1 overflow-hidden">
          <Sidebar 
            onSelectBlog={loadBlog} 
            onGenerate={handleGenerate} 
            isGenerating={isGenerating}
            clearSignal={clearSignal}
            onViewFullHistory={() => setActiveTab('History')}
          />
        </div>
      </div>
      
      {/* Main Workspace Drafting Area */}
      <div className="flex-1 overflow-hidden">
        <MainWorkspace 
          isGenerating={isGenerating}
          streamStatus={streamStatus}
          streamMessage={streamMessage}
          mode={mode}
          plan={plan}
          evidence={evidence}
          logs={logs}
          metrics={metrics}
          latency={latency}
          finalMarkdown={finalMarkdown}
          seoMetadata={seoMetadata}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onSelectBlog={loadBlog}
          selectedBlogId={selectedBlogId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onDeleteBlog={handleDeleteBlog}
          onResume={handleResume}
        />
      </div>
    </div>
  );
};
