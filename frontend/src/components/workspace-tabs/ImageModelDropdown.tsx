import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Image as ImageIcon, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UpgradeModal } from '../UpgradeModal';
import { IMAGE_MODELS } from '../../config/models';

interface ImageModelDropdownProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

export const ImageModelDropdown: React.FC<ImageModelDropdownProps> = ({ selectedModel, onModelSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = IMAGE_MODELS.find(m => m.id === selectedModel) || IMAGE_MODELS[0];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
        title="Select Image Generation Model"
      >
        <ImageIcon size={14} className="text-purple-500" />
        {currentModel.name}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 md:right-0 md:left-auto mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="p-1.5 space-y-1">
              {IMAGE_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (!model.free && user?.plan_name !== 'Pro') {
                      setIsOpen(false);
                      setShowUpgradeModal(true);
                      return;
                    }
                    onModelSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedModel === model.id 
                      ? 'bg-purple-50 text-purple-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={16} className={selectedModel === model.id ? 'text-purple-500' : 'text-slate-400'} />
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="block">{model.name}</span>
                      {!model.free && (
                        <Crown size={12} className="text-amber-500 fill-amber-500/20" />
                      )}
                    </div>
                    <div className={`text-[10px] font-medium ${selectedModel === model.id ? 'text-purple-400' : 'text-slate-400'}`}>
                      {model.free ? 'Free' : 'Premium'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Premium Image Models" 
      />
    </div>
  );
};
