import React from 'react';
import { Loader2 } from 'lucide-react';

export interface EvidenceTabProps {
  evidence: any[];
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({ evidence }) => {
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
};
