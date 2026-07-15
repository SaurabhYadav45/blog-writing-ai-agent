import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998]" onClick={onCancel}></div>
      <div className="fixed bg-white shadow-2xl border border-slate-200 rounded-xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
           style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' }}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          </div>
          <button onClick={onCancel} className="cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-white bg-red-500 border border-transparent rounded-lg hover:bg-red-600 shadow-sm shadow-red-500/20 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
