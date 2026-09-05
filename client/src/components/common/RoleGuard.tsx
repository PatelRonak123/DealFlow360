import React from 'react';
import { UserRole, AuthUser } from '@/types/Auth';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasAnyRole } from '@/lib/accessControl';
import { AccessDenied } from './AccessDenied';

export interface RoleGuardProps {
  allowedRoles: (UserRole | string)[];
  moduleName?: string;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  moduleName,
  children,
}) => {
  const { user } = useAuth();

  const isAllowed = hasAnyRole(user as unknown as AuthUser, allowedRoles);

  if (!isAllowed) {
    return <AccessDenied requiredRoles={allowedRoles as UserRole[]} moduleName={moduleName} />;
  }

  return <>{children}</>;
};

