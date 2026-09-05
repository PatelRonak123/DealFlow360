import React from 'react';
import { UserRole } from '@/types/Auth';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AccessDenied } from './AccessDenied';

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  moduleName?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  moduleName,
  children,
}) => {
  const { user } = useAuth();

  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRoles={allowedRoles} moduleName={moduleName} />;
  }

  return <>{children}</>;
};
