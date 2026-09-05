import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { LuWorkflow } from 'react-icons/lu';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-[#3165E8] text-white shadow-lg shadow-[#3165E8]/25">
            <LuWorkflow size={24} />
          </div>
          <p className="text-sm font-semibold text-[#647592] animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
