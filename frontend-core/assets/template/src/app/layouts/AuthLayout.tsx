import { Suspense, type ReactNode } from 'react';
import { Outlet } from 'react-router';
import { SectionLoader } from '@/components/ui/loader';

/** Login, register and reset pages. */
export function AuthLayout({ logo, children }: { logo?: ReactNode; children?: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      {logo}
      <div className="w-full max-w-md rounded-md border border-line bg-surface p-6">
        <Suspense fallback={<SectionLoader />}>{children ?? <Outlet />}</Suspense>
      </div>
    </main>
  );
}
