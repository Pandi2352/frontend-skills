import type { ReactNode } from 'react';
import type { Permission } from '@/config/permissions';
import { usePermission } from '../hooks/auth-context';

interface CanAccessProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function CanAccess({ permission, fallback = null, children }: CanAccessProps) {
  return usePermission().can(permission) ? children : fallback;
}
