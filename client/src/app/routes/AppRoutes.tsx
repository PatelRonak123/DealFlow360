import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/features/dashboard/layouts/DashboardLayout';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
