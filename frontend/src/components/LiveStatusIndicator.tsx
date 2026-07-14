import React from 'react';
import { Network, Search, ListTree, PenTool, CheckCircle, Loader2 } from 'lucide-react';

interface LiveStatusIndicatorProps {
  currentStatus: string; // 'routing', 'researching', 'orchestrating', 'writing', 'finalizing', 'complete', 'error', 'pending'
  message: string;
}

export function LiveStatusIndicator({ currentStatus, message }: LiveStatusIndicatorProps) {
  // Define the chronological order of statuses
  const steps = [
    { id: 'routing', label: 'Routing', icon: Network, color: 'text-yellow-400' },
    { id: 'researching', label: 'Researching', icon: Search, color: 'text-blue-400' },
    { id: 'orchestrating', label: 'Orchestrating', icon: ListTree, color: 'text-purple-400' },
    { id: 'writing', label: 'Drafting Sections', icon: PenTool, color: 'text-orange-400' },
    { id: 'finalizing', label: 'Finalizing Images', icon: CheckCircle, color: 'text-green-400' },
  ];

  const getCurrentStepIndex = () => {
    if (currentStatus === 'complete') return steps.length;
    if (currentStatus === 'error') return -1;
    return steps.findIndex(s => s.id === currentStatus);
  };

  const currentIndex = getCurrentStepIndex();

  if (currentStatus === 'pending') return null;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl my-6">
      <div className="flex items-center justify-between mb-8 relative">
        {/* Background line connecting icons */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700 rounded-full z-0"></div>
        
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || currentStatus === 'complete';
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500
                ${isCompleted ? `bg-slate-800 ${step.color.replace('text-', 'border-')}` : ''}
                ${isCurrent ? `bg-slate-800 ${step.color.replace('text-', 'border-')} shadow-[0_0_15px_rgba(255,255,255,0.1)]` : ''}
                ${!isCompleted && !isCurrent ? 'bg-slate-900 border-slate-700 text-slate-600' : ''}
              `}>
                {isCurrent ? (
                  <Loader2 className={`w-5 h-5 animate-spin ${step.color}`} />
                ) : (
                  <Icon className={`w-5 h-5 ${isCompleted ? step.color : 'text-slate-600'}`} />
                )}
              </div>
              <span className={`text-xs font-medium absolute -bottom-6 whitespace-nowrap
                ${isCurrent ? 'text-white' : (isCompleted ? 'text-slate-300' : 'text-slate-600')}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-10 p-4 bg-slate-900 rounded-lg border border-slate-700/50 flex items-center gap-3">
        {currentStatus !== 'complete' && currentStatus !== 'error' && (
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
        )}
        <p className={`text-sm font-medium ${currentStatus === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
