import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PlanTabProps {
  plan: any;
}

export const PlanTab: React.FC<PlanTabProps> = ({ plan }) => {
  return (
    <div className="h-full bg-white/50 rounded-xl p-4 md:p-8 overflow-y-auto shadow-sm border border-orange-100">
      {plan ? (
        <div className="prose prose-sm md:prose-base prose-orange max-w-none">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Execution Plan</h2>
          <div className="grid gap-4">
            {plan.tasks?.map((task: any, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-orange-100/50 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-700 m-0">Section {idx + 1}: {task.title}</h3>
                <p className="text-sm text-slate-500 mt-2 mb-3 leading-relaxed">{task.goal}</p>
                {task.bullets && task.bullets.length > 0 && (
                  <ul className="list-disc pl-5 mt-3 text-sm text-slate-600 space-y-1">
                    {task.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 opacity-20" />
          </div>
          <p className="font-medium">Plan will appear here once the orchestrator finishes...</p>
        </div>
      )}
    </div>
  );
};
