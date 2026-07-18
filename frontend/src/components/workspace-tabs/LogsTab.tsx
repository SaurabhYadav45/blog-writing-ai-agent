import React from 'react';

export interface LogsTabProps {
  logs: string[];
  isGenerating: boolean;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, isGenerating }) => {
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
};
