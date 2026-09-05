import React from 'react';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-8 py-4 bg-slate-900 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white tracking-tight">DealFlow360</h2>
        <span className="text-sm text-slate-400 font-medium">Enterprise Platform Architecture</span>
      </header>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
