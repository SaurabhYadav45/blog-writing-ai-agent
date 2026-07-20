import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DangerZoneProps {
  handleDeleteAccount: () => void;
  isLoading: boolean;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  handleDeleteAccount,
  isLoading
}) => {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        Danger Zone
      </h3>
      
      <div className="p-5 border border-red-200 rounded-xl bg-red-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-red-800">Delete Account</p>
          <p className="text-sm text-red-600 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
        </div>
        <button type="button" onClick={handleDeleteAccount} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap cursor-pointer">
          <Trash2 className="w-4 h-4" />
          {isLoading ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </section>
  );
};
