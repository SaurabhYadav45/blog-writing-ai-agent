import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      suppressErrorRendering: true,
    });

    if (containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      setHasError(false);
      
      try {
        // We use a unique ID for each render to avoid conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Sometimes LLMs generate nested markdown blocks, let's clean them up
        let cleanChart = chart.trim();
        if (cleanChart.startsWith('```')) {
           cleanChart = cleanChart.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
        }

        mermaid.render(id, cleanChart).then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        }).catch((error) => {
          console.error('Mermaid promise rejection:', error);
          setHasError(true);
        });
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setHasError(true);
      }
    }
  }, [chart]);

  if (hasError) {
    return (
      <div className="my-6 p-4 bg-[#1e1e1e] rounded-xl border border-slate-700 text-slate-300 font-mono text-sm overflow-x-auto shadow-xl">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-700/50 pb-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
          <span className="text-xs font-medium text-rose-400 font-mono">mermaid parse error</span>
        </div>
        <pre className="whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid mermaid-container my-6 flex justify-center w-full" />;
};
