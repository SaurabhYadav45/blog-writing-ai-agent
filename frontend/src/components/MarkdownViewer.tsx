import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden mt-8">
      <div className="bg-slate-800/50 p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Generated Blog Post</h2>
      </div>
      
      <div className="p-8 prose prose-invert prose-indigo max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
