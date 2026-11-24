import type { ReactNode } from 'react';
import { ConfirmProvider } from '@/components/shared/confirm';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { Toaster } from '@/components/ui/toast';

/** Everything that must exist once. Put it around the router. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ConfirmProvider>{children}</ConfirmProvider>
      <Toaster />
    </ErrorBoundary>
  );
}
