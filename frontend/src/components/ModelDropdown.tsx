import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bot, Cpu, Sparkles } from 'lucide-react';

interface ModelDropdownProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({ selectedModel, onModelSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const models = [
    { id: 'GPT-5', icon: Bot, desc: 'Most Capable' },
    { id: 'Claude', icon: Cpu, desc: 'Best Reasoning' },
    { id: 'Gemini', icon: Sparkles, desc: 'Fastest' }
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[0];
  const CurrentIcon = currentModel.icon;

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
      >
        <CurrentIcon size={14} className="text-orange-500" />
        {selectedModel}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="p-1.5 space-y-1">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedModel === model.id 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <model.icon size={16} className={selectedModel === model.id ? 'text-orange-500' : 'text-slate-400'} />
                  <div className="text-left flex-1">
                    <div className="block">{model.id}</div>
                    <div className={`text-[10px] font-medium ${selectedModel === model.id ? 'text-orange-400' : 'text-slate-400'}`}>
                      {model.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
