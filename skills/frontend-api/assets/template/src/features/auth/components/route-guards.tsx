import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Permission } from '@/config/permissions';
import { useAuth, usePermission } from '../hooks/auth-context';
import { safePath } from '../utils/safe-path';

interface GuardProps {
  /** Page loader while the session is restored. */
  loader?: ReactNode;
  /** Error state with a retry button. */
  error?: (retry: () => void) => ReactNode;
  loginPath?: string;
}

const defaultError = (retry: () => void) => (
  <div role="alert">
    <p>Could not reach the server.</p>
    <Button onClick={retry}>Try again</Button>
  </div>
);

/** Signed-in people only. */
export function ProtectedRoute({ loader = null, error = defaultError, loginPath = '/login' }: GuardProps) {
  const { status, retry } = useAuth();
  const { pathname, search, hash } = useLocation();
  if (status === 'loading') return loader;
  if (status === 'error') return error(retry);
  if (status === 'signedOut') {
    return <Navigate to={loginPath} replace state={{ from: pathname + search + hash }} />;
  }
  return <Outlet />;
}

/** Login and register: signed-in people go back to where they came from. */
export function GuestRoute({ loader = null }: Pick<GuardProps, 'loader'>) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return loader;
  if (status === 'signedIn') {
    const state = location.state as { from?: unknown } | null;
    return <Navigate to={safePath(state?.from)} replace />;
  }
  return <Outlet />;
}

interface PermissionRouteProps {
  permission: Permission;
  forbidden?: ReactNode;
}

/** Use inside ProtectedRoute. */
export function PermissionRoute(props: PermissionRouteProps) {
  const { permission, forbidden = <p role="alert">You do not have permission to see this page.</p> } = props;
  return usePermission().can(permission) ? <Outlet /> : forbidden;
}
