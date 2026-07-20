import React from 'react';
import { User, Sparkles } from 'lucide-react';

interface ProfileSettingsProps {
  user: any;
  fullName: string;
  setFullName: (val: string) => void;
  personaType: string;
  setPersonaType: (val: string) => void;
  brandPersona: string;
  setBrandPersona: (val: string) => void;
  setShowUpgradeModal: (val: boolean) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  fullName,
  setFullName,
  personaType,
  setPersonaType,
  brandPersona,
  setBrandPersona,
  setShowUpgradeModal,
}) => {
  return (
    <>
      {/* Profile Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Profile Information
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-100"></div>

      {/* Brand Voice Section */}
      <section className="space-y-5">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Brand Voice & Persona
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Define the default tone and personality for your AI-generated blogs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Persona Type</label>
            <select
              value={personaType}
              onChange={(e) => {
                if (e.target.value === 'Custom' && user?.plan_name !== 'Pro') {
                  setShowUpgradeModal(true);
                  return;
                }
                setPersonaType(e.target.value);
                if (e.target.value !== 'Custom') setBrandPersona('');
              }}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
            >
              <option value="Casual">Casual & Friendly</option>
              <option value="Professional">Professional & Corporate</option>
              <option value="Humorous">Humorous & Witty</option>
              <option value="Technical">Technical & Analytical</option>
              <option value="Custom">Custom Persona</option>
            </select>
          </div>
          {personaType === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Custom Persona Instructions</label>
              <textarea
                value={brandPersona}
                onChange={(e) => setBrandPersona(e.target.value)}
                placeholder="E.g., Write like a witty tech reviewer who uses emojis..."
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none h-24 resize-none"
              />
            </div>
          )}
        </div>
      </section>

      <div className="w-full h-px bg-slate-100"></div>
    </>
  );
};
