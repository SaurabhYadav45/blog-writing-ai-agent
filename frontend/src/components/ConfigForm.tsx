import React, { useState, useEffect } from 'react';
import { Settings2, Send } from 'lucide-react';

interface ConfigFormProps {
  onGenerate: (topic: string, tone: string, audience: string, depth: string, referenceUrls: string) => void;
  disabled: boolean;
  clearSignal: number;
}

export function ConfigForm({ onGenerate, disabled, clearSignal }: ConfigFormProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Story-driven (Engaging)");
  const [audience, setAudience] = useState("Intermediate");
  const [depth, setDepth] = useState("Standard Guide");
  const [referenceUrls, setReferenceUrls] = useState("");

  useEffect(() => {
    if (clearSignal > 0) {
      setTopic("");
    }
  }, [clearSignal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate(topic, tone, audience, depth, referenceUrls);
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden mt-2 mb-8">
      <div className="bg-orange-50/50 p-4 border-b border-orange-200/50 flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-orange-600" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Generation Settings</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Blog Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={disabled}
            placeholder="e.g., The Future of Gen AI..."
            className="w-full bg-white/50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={disabled}
            className="w-full bg-white/50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Senior">Senior</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={disabled}
            className="w-full bg-white/50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50"
          >
            <option value="Story-driven (Engaging)">Story-driven (Engaging)</option>
            <option value="Conversational">Conversational</option>
            <option value="Professional">Professional</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Depth / Complexity</label>
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            disabled={disabled}
            className="w-full bg-white/50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50"
          >
            <option value="Brief Overview">Brief Overview</option>
            <option value="Standard Guide">Standard Guide</option>
            <option value="Ultimate Deep-Dive">Ultimate Deep-Dive</option>
          </select>
        </div>



        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Reference URLs <span className="text-slate-400 normal-case font-normal">(Optional, comma separated)</span>
          </label>
          <input
            type="text"
            value={referenceUrls}
            onChange={(e) => setReferenceUrls(e.target.value)}
            disabled={disabled}
            placeholder="e.g., https://example.com, https://test.com"
            className="w-full bg-white/50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !topic.trim()}
          className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg shadow-orange-500/30 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {disabled ? "Generating..." : "Generate Post"}
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
