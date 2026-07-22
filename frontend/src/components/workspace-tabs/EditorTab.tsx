import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Save, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { analyzeSEO, type SEOResult } from '../../utils/seo';
import { useAuth } from '../../context/AuthContext';
import { UpgradeModal } from '../UpgradeModal';

export interface EditorTabProps {
  editableMarkdown: string;
  handleEditorChange: (e: any) => void;
  handleTextSelection: (e: any) => void;
  setShowRegeneratePopup: (show: boolean) => void;
  isDirty: boolean;
  isSaving: boolean;
  handleSave: () => void;
}

export const EditorTab: React.FC<EditorTabProps> = ({
  editableMarkdown,
  handleEditorChange,
  handleTextSelection,
  setShowRegeneratePopup,
  isDirty,
  isSaving,
  handleSave
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [seoData, setSeoData] = useState<SEOResult | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuth();

  // Auto-resize textarea and calculate SEO
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
    
    // Debounce SEO calculation
    const timer = setTimeout(() => {
      if (editableMarkdown) {
        setSeoData(analyzeSEO(editableMarkdown));
      } else {
        setSeoData(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [editableMarkdown]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-amber-100 border-amber-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row h-full">
      {editableMarkdown ? (
        <>
          {/* Main Editor Section */}
          <div className="w-full md:w-2/3 flex flex-col relative border-r border-slate-100">
            <div className="bg-slate-100 p-3 sm:p-2 rounded-tl-xl border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 sticky top-0 z-10">
               <span className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-0 sm:pl-2">Raw Markdown Editor</span>
               <div className="flex items-center gap-3">
                 <span className="hidden lg:flex text-[11px] font-medium text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-md border border-amber-200 shadow-sm items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                   Select text to Regenerate
                 </span>
                 <button 
                   onClick={() => {
                     if (user?.plan_name !== 'Pro') {
                       setShowUpgradeModal(true);
                       return;
                     }
                     setShowRegeneratePopup(true);
                   }}
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
              className="w-full p-6 bg-slate-900 text-slate-200 font-mono text-sm rounded-bl-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none leading-relaxed overflow-hidden"
              style={{ minHeight: '70vh' }}
              value={editableMarkdown}
              onChange={handleEditorChange}
              onSelect={handleTextSelection}
              placeholder="Blog markdown content..."
            />
          </div>

          {/* SEO Side Panel */}
          <div className="w-full md:w-1/3 bg-slate-50 flex flex-col rounded-r-xl border-l border-slate-200 overflow-y-auto">
            <div className="bg-white p-3 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">SEO & Optimization</h3>
            </div>
            
            {seoData ? (
              <div className="p-5 space-y-6">
                {/* Overall Score */}
                <div className="flex flex-col items-center">
                  <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-[6px] ${getScoreBg(seoData.score)}`}>
                    <span className={`text-3xl font-extrabold ${getScoreColor(seoData.score)}`}>{seoData.score}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mt-2">Overall Score</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Words</p>
                    <p className="text-lg font-bold text-slate-700">{seoData.wordCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Readability</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{seoData.readabilityLevel}</p>
                  </div>
                </div>

                {/* Keyword Density */}
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Top Keywords</h4>
                  <div className="space-y-2">
                    {seoData.keywordDensity.length > 0 ? (
                      seoData.keywordDensity.map((kw, i) => (
                        <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                          <span className="text-sm font-medium text-slate-700">{kw.word}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">{kw.count}x</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${kw.density > 4 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                              {kw.density}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No significant keywords found.</p>
                    )}
                  </div>
                </div>

                {/* Suggestions / Tips */}
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">Actionable Tips</h4>
                  <ul className="space-y-2">
                    {seoData.suggestions.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-md border border-slate-200 shadow-sm">
                        {tip.includes('Great job') ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : tip.includes('Missing') || tip.includes('detected') || tip.includes('very difficult') ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs text-slate-700 leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">
                Analyzing content...
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center h-full text-slate-400 space-y-4 min-h-[400px] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-2">
             <img src="/icon.png" alt="icon" className="w-10 h-10 opacity-30 grayscale" />
          </div>
          <p className="font-medium text-lg">No content loaded</p>
          <p className="text-sm">Select a topic from the sidebar or generate a new blog.</p>
        </div>
      )}

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Blog Regeneration" 
      />
    </div>
  );
};
