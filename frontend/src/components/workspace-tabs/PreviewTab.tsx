import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Send, X, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MermaidDiagram } from '../MermaidDiagram';
import { TableOfContents } from '../TableOfContents';
import { extractToc } from '../../utils/toc';
import { useAuth } from '../../context/AuthContext';
import { UpgradeModal } from '../UpgradeModal';

export interface PreviewTabProps {
  editableMarkdown: string;
  finalMarkdown: string | null;
  seoMetadata?: {
    meta_description?: string;
    slug?: string;
    focus_keywords?: string[];
  } | null;
  isGenerating: boolean;
  streamMessage: string;
  isTocCollapsed: boolean;
  setIsTocCollapsed: (collapsed: boolean) => void;
  onPublish?: (platform: string) => Promise<void>;
  isPublishing?: boolean;
  onPromote?: (platform: string) => Promise<void>;
  isPromoting?: boolean;
  streamStatus?: string;
  onResume?: () => void;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({
  editableMarkdown,
  finalMarkdown,
  seoMetadata,
  isGenerating,
  streamMessage,
  isTocCollapsed,
  setIsTocCollapsed,
  onPublish,
  isPublishing,
  onPromote,
  isPromoting,
  streamStatus,
  onResume
}) => {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const { user } = useAuth();
  
  return (
    <div className="bg-white rounded-xl p-4 md:py-10 md:pl-10 md:pr-4 shadow-sm border border-slate-100">
      {editableMarkdown ? (
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto items-start relative">
          
          {/* Main Markdown Content Area */}
          <div className="w-full flex-1 min-w-0 transition-all duration-300">
            {finalMarkdown && onPublish && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Publish Blog
                </button>
              </div>
            )}
            <article className="prose prose-sm md:prose-base lg:prose-lg prose-slate max-w-none prose-headings:font-extrabold prose-a:text-orange-500 prose-img:rounded-xl prose-img:shadow-md prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-td:p-3 prose-th:p-3 prose-tr:border-b prose-tr:border-slate-100 prose-blockquote:border-l-4 prose-blockquote:border-orange-400 prose-blockquote:bg-orange-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
                components={{
                  h2({ node: _node, children, ...props }: any) {
                    const text = String(children).replace(/[*_~`]/g, '');
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return <h2 id={id || undefined} className="scroll-mt-24" {...props}>{children}</h2>;
                  },
                  h3({ node: _node, children, ...props }: any) {
                    const text = String(children).replace(/[*_~`]/g, '');
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return <h3 id={id || undefined} className="scroll-mt-24" {...props}>{children}</h3>;
                  },
                  h4({ node: _node, children, ...props }: any) {
                    const text = String(children).replace(/[*_~`]/g, '');
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return <h4 id={id || undefined} className="scroll-mt-24" {...props}>{children}</h4>;
                  },
                  code({ node: _node, inline, className, children, ...props }: any) {
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
          {streamStatus === 'error' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border border-red-100 mb-2">
                 <img src="/icon.png" alt="icon" className="w-10 h-10 opacity-40 grayscale sepia hue-rotate-320" />
              </div>
              <p className="font-semibold text-lg text-red-600">Generation Interrupted</p>
              <p className="text-sm text-slate-500 max-w-md text-center">
                This blog generation was interrupted. You can resume it from the last saved state without wasting credits.
              </p>
              {onResume && (
                <button 
                  onClick={onResume}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer mt-2"
                >
                  Resume Generation
                </button>
              )}
            </>
          ) : isGenerating ? (
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

      {/* Publish Modal via React Portal */}
      {showPublishModal && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isPublishing && setShowPublishModal(false)}></div>
          <div className="relative bg-white p-6 shadow-2xl rounded-2xl z-[9999] w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-6 h-6 text-orange-500" />
                Publish Blog
              </h3>
              <button 
                onClick={() => !isPublishing && setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-600 text-sm mb-6">
              Select the platform you want to publish this blog to. Make sure you have configured your CMS credentials in Settings.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={async () => {
                  if (user?.plan_name !== 'Pro') {
                    setShowPublishModal(false);
                    setUpgradeFeature("CMS Auto-Publishing");
                    setShowUpgradeModal(true);
                    return;
                  }
                  if (onPublish) {
                    await onPublish('wordpress');
                    setShowPublishModal(false);
                  }
                }}
                disabled={isPublishing}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00749C] rounded-lg flex items-center justify-center text-white font-bold text-xl">W</div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 group-hover:text-orange-700">WordPress</p>
                    <p className="text-xs text-slate-500">Publish to your WordPress site</p>
                  </div>
                </div>
                <Send className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
              </button>

              <button 
                onClick={async () => {
                  if (user?.plan_name !== 'Pro') {
                    setShowPublishModal(false);
                    setUpgradeFeature("CMS Auto-Publishing");
                    setShowUpgradeModal(true);
                    return;
                  }
                  if (onPublish) {
                    await onPublish('medium');
                    setShowPublishModal(false);
                  }
                }}
                disabled={isPublishing}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-800 hover:bg-slate-50 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">M</div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 group-hover:text-black">Medium</p>
                    <p className="text-xs text-slate-500">Publish to your Medium profile</p>
                  </div>
                </div>
                <Send className="w-5 h-5 text-slate-400 group-hover:text-black" />
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-slate-400 uppercase font-bold tracking-wider">Promotion</span>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (user?.plan_name !== 'Pro') {
                    setShowPublishModal(false);
                    setUpgradeFeature("LinkedIn AI Promotion");
                    setShowUpgradeModal(true);
                    return;
                  }
                  if (onPromote) {
                    await onPromote('linkedin');
                    setShowPublishModal(false);
                  }
                }}
                disabled={isPromoting || isPublishing}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white font-bold text-xl">in</div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 group-hover:text-blue-700">LinkedIn (AI Post)</p>
                    <p className="text-xs text-slate-500">Generate and post a short promo</p>
                  </div>
                </div>
                <Send className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              </button>
            </div>
            
            {(isPublishing || isPromoting) && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm z-[10000]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <p className="font-bold text-slate-700">{isPromoting ? 'Generating AI Post & Publishing...' : 'Publishing...'}</p>
                <p className="text-sm text-slate-500 mt-1">This may take a few seconds.</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName={upgradeFeature} 
      />
    </div>
  );
};
