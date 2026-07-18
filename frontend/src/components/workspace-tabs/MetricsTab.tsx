import React from 'react';
import { MODEL_PRICING } from '../../config/models';

export interface MetricsTabProps {
  metrics: any[];
  latency: number;
  isGenerating: boolean;
}

const calculateCost = (model: string, input: number, output: number) => {
  // Try exact match first
  let pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  
  if (!pricing) {
    // Fallback logic for case-insensitive or partial matches
    const m = model.toLowerCase();
    const key = Object.keys(MODEL_PRICING).find(k => k.toLowerCase() === m);
    if (key) {
      pricing = MODEL_PRICING[key as keyof typeof MODEL_PRICING];
    } else if (m.includes('image')) {
      pricing = MODEL_PRICING['gpt-image-1'];
    }
  }

  if (!pricing) return 0;
  if (model.includes('image')) return pricing.input; // flat rate for images
  
  return (input / 1000000) * pricing.input + (output / 1000000) * pricing.output;
};

export const MetricsTab: React.FC<MetricsTabProps> = ({ metrics, latency, isGenerating }) => {
  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  const totalInput = safeMetrics.reduce((acc, m) => acc + (m.input_tokens || 0), 0);
  const totalOutput = safeMetrics.reduce((acc, m) => acc + (m.output_tokens || 0), 0);
  const totalImages = safeMetrics.reduce((acc, m) => acc + (m.images_generated || 0), 0);
  
  let totalCost = 0;
  safeMetrics.forEach(m => {
    if (m.images_generated) {
      totalCost += m.images_generated * 0.04;
    } else {
      totalCost += calculateCost(m.model_name || '', m.input_tokens || 0, m.output_tokens || 0);
    }
  });

  return (
    <div className="h-full bg-slate-50/50 p-6 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Tokens</span>
          <span className="text-2xl font-bold text-slate-800">{(totalInput + totalOutput).toLocaleString()}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Cost</span>
          <span className="text-2xl font-bold text-green-600">${totalCost.toFixed(4)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Images Generated</span>
          <span className="text-2xl font-bold text-blue-600">{totalImages}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Latency</span>
          <span className="text-2xl font-bold text-orange-500">{latency > 0 ? `${latency}s` : 'Live...'}</span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-6">Execution Timeline</h3>
      <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
        {safeMetrics.map((m, idx) => {
          const nodeCost = m.images_generated 
            ? m.images_generated * 0.04 
            : calculateCost(m.model_name || '', m.input_tokens || 0, m.output_tokens || 0);
            
          return (
            <div key={idx} className="relative pl-6 animate-in slide-in-from-left-4 fade-in duration-500">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-orange-400"></div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800">{m.node}</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                    {m.model_name}
                  </span>
                </div>
                {m.images_generated ? (
                  <p className="text-sm text-slate-600">Images Generated: <span className="font-medium text-slate-800">{m.images_generated}</span></p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="text-sm">
                      <span className="text-slate-500">Input: </span>
                      <span className="font-medium">{m.input_tokens?.toLocaleString()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Output: </span>
                      <span className="font-medium">{m.output_tokens?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="mt-3 text-right">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    +${nodeCost.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {isGenerating && (
          <div className="relative pl-6 animate-pulse">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-slate-300"></div>
            <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 text-slate-400 text-sm italic">
              Processing next node...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
