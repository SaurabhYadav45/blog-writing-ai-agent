import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { Menu, X } from 'lucide-react';

function App() {
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  
  // Mobile responsive state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for the generation workflow
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('Claude');
  const [streamStatus, setStreamStatus] = useState<string>('pending');
  const [streamMessage, setStreamMessage] = useState<string>('');
  const [clearSignal, setClearSignal] = useState<number>(0);
  
  // Data States
  const [mode, setMode] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [finalMarkdown, setFinalMarkdown] = useState<string | null>(null);
  const [seoMetadata, setSeoMetadata] = useState<any>(null);
  
  // Lifted Workspace State
  const [activeTab, setActiveTab] = useState('Preview');

  // Load a historic blog from the sidebar
  const loadBlog = async (id: number, isLiveCompletion: boolean = false) => {
    setIsMobileMenuOpen(false); // Close menu on mobile when a blog is selected
    setSelectedBlogId(id);
    setIsGenerating(false);
    setStreamStatus('complete');
    setActiveTab('Preview');
    
    // Only clear state if we are clicking a historic blog from the sidebar
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
      const response = await fetch(`http://localhost:8000/api/blogs/${id}`);
      const data = await response.json();
      setFinalMarkdown(data.markdown_content || "No content generated yet.");
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

  // Start the generation process
  const handleGenerate = async (topic: string, tone: string, audience: string, depth: string, cta: string, referenceUrls: string) => {
    setIsMobileMenuOpen(false); // Close menu on mobile
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
      // 1. Send the POST request to start the process
      const response = await fetch('http://localhost:8000/api/blogs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, audience, depth, cta, reference_urls: referenceUrls, model_name: selectedModel })
      });
      
      if (!response.ok) throw new Error("Failed to start generation");
      
      const { blog_id } = await response.json();
      setSelectedBlogId(blog_id);
      setLogs(prev => [...prev, `Created blog record #${blog_id}. Opening SSE stream...`]);

      // 2. Open Server-Sent Events (SSE) connection
      const eventSource = new EventSource(`http://localhost:8000/api/blogs/stream/${blog_id}`);
      
      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        setStreamStatus(data.status);
        setStreamMessage(data.message);
        
        setLogs(prev => [...prev, `[${data.status.toUpperCase()}] ${data.message}`]);
        
        // Check for specific payload updates from our backend changes
        if (data.mode) setMode(data.mode);
        if (data.plan) setPlan(data.plan);
        if (data.evidence) setEvidence(data.evidence);
        if (data.metrics) setMetrics(data.metrics);
        if (data.latency) setLatency(data.latency);
        if (data.seo_metadata) setSeoMetadata(data.seo_metadata);
        
        // 3. When backend says it's complete or error, close the stream
        if (data.status === 'complete' || data.status === 'error') {
          eventSource.close();
          setIsGenerating(false);
          
          if (data.status === 'complete') {
            setLogs(prev => [...prev, `Stream complete. Fetching final markdown...`]);
            loadBlog(blog_id, true);
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
      setStreamMessage('Failed to initialize blog generation.');
      setLogs(prev => [...prev, `ERROR: ${error.message}`]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-orange-50 relative">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50">
         <div className="flex items-center gap-2">
            <img src="/icon.png" alt="icon" className="w-8 h-8 rounded-lg shadow-sm border border-orange-200 object-cover" />
            <span className="font-extrabold text-slate-800 tracking-tight">BlogFusion</span>
         </div>
         <button 
           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
           className="p-2 bg-white rounded-md shadow-sm border border-orange-100 text-orange-600 hover:bg-orange-50 transition-colors"
         >
           {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
         </button>
      </div>

      {/* Sidebar - Overlays on mobile, side-by-side on desktop */}
      <div className={`
        ${isMobileMenuOpen ? 'absolute inset-0 top-[73px] z-40 bg-white/95 backdrop-blur-3xl flex' : 'hidden'} 
        md:flex md:relative md:bg-transparent md:h-screen w-full md:w-80
      `}>
        <Sidebar 
          onSelectBlog={loadBlog} 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating}
          clearSignal={clearSignal}
        />
      </div>
      
      {/* Main Workspace Area */}
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
        />
      </div>
    </div>
  );
}

export default App;
