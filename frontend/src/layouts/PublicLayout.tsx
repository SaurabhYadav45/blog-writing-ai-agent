/**
 * Public Layout Wrapper.
 * A simple wrapper component that defines container layout classes
 * for unauthenticated public pages. Renders matching child endpoints via Outlet.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

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
