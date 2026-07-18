import React from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white p-8 shadow-2xl rounded-2xl z-[9999] w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200 border border-orange-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center border border-orange-200 shadow-sm mb-5 relative">
            <Crown className="w-8 h-8 text-orange-500 relative z-10 drop-shadow-sm" />
            <div className="absolute inset-0 bg-orange-400 blur-xl opacity-20"></div>
          </div>
          
          <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Upgrade to Pro</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-8 px-2">
            <strong>{featureName}</strong> is a Premium feature. Upgrade to the Pro tier today to unlock advanced models, unlimited generations, multi-image generation, and auto-publishing.
          </p>
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => {
                onClose();
                navigate('/settings?upgrade=true');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Crown className="w-4 h-4 fill-white/80" />
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 px-5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
