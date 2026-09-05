import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserRole } from '@/types/Auth';

export interface AccessDeniedProps {
  requiredRoles?: UserRole[];
  moduleName?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRoles = [],
  moduleName = 'this feature',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleNameMap: Record<UserRole, string> = {
    sales_rep: 'Sales Representative',
    sales_manager: 'Sales Manager',
    finance_ops: 'Finance & Operations',
    customer: 'Customer Portal',
    admin: 'System Administrator',
  };

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-3 border border-red-200">
        <Lock className="h-3.5 w-3.5" />
        <span>Role-Based Access Restricted</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#17213a] sm:text-3xl">
        Restricted Enterprise Area
      </h1>

      <p className="mt-3 max-w-md text-sm text-[#59657d] leading-relaxed">
        You are currently logged in as a <strong className="text-[#17213a]">{roleNameMap[user.role]}</strong>.
        Access to <strong className="text-[#17213a]">{moduleName}</strong> is restricted by DealFlow360 governance policies.
      </p>

      {requiredRoles.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
          Authorized roles: <span className="font-semibold text-gray-900">{requiredRoles.map((r) => roleNameMap[r]).join(', ')}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/dashboard')}
        >
          Return to My Dashboard
        </Button>
      </div>
    </div>
  );
};
