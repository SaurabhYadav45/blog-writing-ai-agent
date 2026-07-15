import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent relative overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>


    </div>
  );
};
