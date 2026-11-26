import type { ReactNode } from 'react';
import { Drawer } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import type { NavGroup } from '../navigation';
import { useSidebar } from './sidebar-context';
import { SidebarNav } from './SidebarNav';

type Slot = ReactNode | ((collapsed: boolean) => ReactNode);
const fill = (slot: Slot, collapsed: boolean) => (typeof slot === 'function' ? slot(collapsed) : slot);

export interface SidebarProps {
  groups: NavGroup[];
  /** Logo and app name; gets `collapsed`. */
  header?: Slot;
  /** User, help, version. */
  footer?: Slot;
  /** While permissions load. */
  loading?: boolean;
  /** A filter field above the menu. Default: from 10 items on. */
  filterable?: boolean;
}

function NavSkeleton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Skeleton key={n} className={collapsed ? 'mx-auto size-10' : 'h-9'} />
      ))}
    </div>
  );
}

/** From `lg` up. The button that collapses it is in the navbar (SidebarToggle). */
export function Sidebar({ groups, header, footer, loading, filterable }: SidebarProps) {
  const { isCollapsed } = useSidebar();
  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-e border-line bg-surface lg:flex',
        isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <div className={cn('flex h-header shrink-0 items-center border-b border-line', isCollapsed ? 'justify-center' : 'px-4')}>
        {fill(header, isCollapsed)}
      </div>
      <div className={cn('min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-4', isCollapsed ? 'px-2' : 'px-3')}>
        {loading ? <NavSkeleton collapsed={isCollapsed} /> : <SidebarNav groups={groups} collapsed={isCollapsed} {...(filterable === undefined ? {} : { filterable })} />}
      </div>
      {footer && <div className="shrink-0 border-t border-line p-2">{fill(footer, isCollapsed)}</div>}
    </aside>
  );
}

export function MobileSidebar({ groups, footer, loading, filterable }: SidebarProps) {
  const { isMobileOpen, closeMobile } = useSidebar();
  return (
    <Drawer open={isMobileOpen} onClose={closeMobile} side="left" size="sm" title={uiText.mainMenu} footer={footer && fill(footer, false)}>
      {loading ? <NavSkeleton /> : <SidebarNav groups={groups} onNavigate={closeMobile} {...(filterable === undefined ? {} : { filterable })} />}
    </Drawer>
  );
}
