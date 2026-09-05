import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <div className="max-w-4xl mx-auto text-center pt-16">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-blue-500">
                DealFlow360
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                Enterprise CPQ, Deal Governance, and Revenue Operations Platform
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-medium shadow-lg">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Monorepo Architecture Initialized & Ready for Domain Development
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
