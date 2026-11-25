import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import { Navbar, MobileMenuButton, type NavbarProps } from '@/components/layout/navbar';
import { filterNav, type CanSee, type NavGroup } from '@/components/layout/navigation';
import { MobileSidebar, Sidebar, SidebarProvider, type SidebarProps } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { OfflineBanner } from '@/components/shared/states';
import { PageSkeleton } from '@/components/ui/skeleton';
import { uiText } from '@/constants/ui-text';

export interface AppLayoutProps extends Pick<SidebarProps, 'header' | 'footer' | 'loading'> {
  nav: NavGroup[];
  /** Hides menu items. Routes and the server must check too. */
  can?: CanSee;
  navbar?: Pick<NavbarProps, 'center' | 'right'> & { left?: ReactNode };
  /** Instead of the routed page. */
  children?: ReactNode;
}

const everything: CanSee = () => true;

/** Sidebar, navbar and the page. Only the main area scrolls. */
export function AppLayout({ nav, can = everything, navbar, children, ...sidebar }: AppLayoutProps) {
  const groups = useMemo(() => filterNav(nav, can), [nav, can]);
  const { pathname, key } = useLocation();
  const type = useNavigationType();
  const main = useRef<HTMLElement>(null);
  const positions = useRef(new Map<string, number>());
  const firstPath = useRef<string | null>(null);

  // New page: focus it and start at the top. Back: return to the old position.
  useEffect(() => {
    const element = main.current;
    if (!element) return;
    if (firstPath.current === null) firstPath.current = pathname;
    else if (firstPath.current !== pathname) {
      firstPath.current = pathname;
      element.focus({ preventScroll: true });
      element.scrollTop = type === 'POP' ? (positions.current.get(key) ?? 0) : 0;
    }
  }, [pathname, key, type]);

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-(--z-tooltip) focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:outline-2 focus:outline-focus"
      >
        {uiText.skip}
      </a>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar groups={groups} {...sidebar} />
        <MobileSidebar groups={groups} {...sidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <OfflineBanner />
          <Navbar
            left={
              <>
                <MobileMenuButton />
                {navbar?.left}
              </>
            }
            center={navbar?.center}
            right={navbar?.right}
          />
          <main
            ref={main}
            id="main-content"
            tabIndex={-1}
            onScroll={(event) => positions.current.set(key, event.currentTarget.scrollTop)}
            className="relative min-h-0 flex-1 overflow-auto outline-none"
          >
            <ErrorBoundary resetKey={pathname}>
              <Suspense fallback={<div className="p-4 md:p-6"><PageSkeleton /></div>}>{children ?? <Outlet />}</Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
