import React, { useEffect, useState } from 'react';
import type { TocItem } from '../utils/toc';
import { List } from 'lucide-react';

interface TableOfContentsProps {
  toc: TocItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ toc, isCollapsed = false, onToggle }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (toc.length === 0 || isCollapsed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '0px 0px -80% 0px',
        threshold: 1.0,
      }
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc, isCollapsed]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (toc.length === 0) return null;

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center sticky top-4">
        <button 
          onClick={onToggle}
          className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all cursor-pointer group"
          title="Expand Table of Contents"
        >
          <List className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-rose-400"></div>
      
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800">
          <List className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-sm tracking-tight uppercase">Table of Contents</h3>
        </div>
        {onToggle && (
          <button 
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
      </div>

      <div className="p-2 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
        <nav>
          <ul className="space-y-1.5 text-sm pb-4">
            {(() => {
              let mainTopicCounter = 0;
              return toc.map((item, index) => {
                if (item.level === 2) {
                  mainTopicCounter++;
                }
                const isMainTopic = item.level === 2;
                const paddingLeft = isMainTopic ? 0 : (item.level - 2) * 16;
                const isActive = activeId === item.id;
                
                return (
                  <React.Fragment key={item.id}>
                    {isMainTopic && index > 0 && (
                      <div className="border-t border-slate-200/70 my-3 mx-2"></div>
                    )}
                    <li style={{ paddingLeft: `${paddingLeft}px` }}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => handleClick(e, item.id)}
                        className={`group py-1.5 px-2 rounded-md transition-all duration-200 text-xs sm:text-sm flex items-start gap-2
                          ${isActive 
                            ? 'text-orange-600 bg-orange-50/80 font-bold border-l-2 border-orange-500' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent'
                          }`}
                      >
                        {isMainTopic ? (
                          <span className={`font-bold shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {mainTopicCounter}.
                          </span>
                        ) : (
                          <span className={`mt-1.5 shrink-0 text-[8px] ${isActive ? 'text-orange-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                            ●
                          </span>
                        )}
                        <span className="leading-tight mt-0.5">{item.text}</span>
                      </a>
                    </li>
                  </React.Fragment>
                );
              });
            })()}
          </ul>
        </nav>
      </div>
    </div>
  );
};
