import { createContext, useContext } from 'react';
import { ROLE_PERMISSIONS, type Permission } from '@/config/permissions';
import type { AuthUser, Credentials } from '../types/auth.types';

export interface Auth {
  /** error: the server could not be reached while restoring. */
  status: 'loading' | 'signedIn' | 'signedOut' | 'error';
  user: AuthUser | null;
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
}

export const AuthContext = createContext<Auth | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth needs AuthProvider');
  return auth;
}

export function usePermission() {
  const { user } = useAuth();
  const granted: readonly Permission[] = user
    ? (user.permissions ?? ROLE_PERMISSIONS[user.role] ?? [])
    : [];
  const can = (permission: Permission) => granted.includes(permission);
  return {
    can,
    canAny: (list: Permission[]) => list.some(can),
    canAll: (list: Permission[]) => list.every(can),
  };
}
