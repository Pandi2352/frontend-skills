import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui/button';
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
  /** Logo and app name. */
  header?: Slot;
  /** User, help, version. */
  footer?: Slot;
  /** While permissions load. */
  loading?: boolean;
}

function NavSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <Skeleton key={n} className="h-8" />
      ))}
    </div>
  );
}

/** From `lg` up. Phones use MobileSidebar. */
export function Sidebar({ groups, header, footer, loading }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150 lg:flex',
        isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <div className={cn('flex h-header shrink-0 items-center gap-2 border-b border-line px-3', isCollapsed && 'justify-center px-0')}>
        {!isCollapsed && <div className="min-w-0 flex-1">{fill(header, false)}</div>}
        <IconButton
          icon={isCollapsed ? PanelLeftOpen : PanelLeftClose}
          label={isCollapsed ? uiText.expand : uiText.collapse}
          aria-expanded={!isCollapsed}
          onClick={toggleCollapsed}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
        {loading ? <NavSkeleton /> : <SidebarNav groups={groups} collapsed={isCollapsed} />}
      </div>
      {footer && <div className="shrink-0 border-t border-line p-2">{fill(footer, isCollapsed)}</div>}
    </aside>
  );
}

export function MobileSidebar({ groups, footer, loading }: SidebarProps) {
  const { isMobileOpen, closeMobile } = useSidebar();
  return (
    <Drawer open={isMobileOpen} onClose={closeMobile} side="left" size="sm" title={uiText.mainMenu} footer={footer && fill(footer, false)}>
      {loading ? <NavSkeleton /> : <SidebarNav groups={groups} onNavigate={closeMobile} />}
    </Drawer>
  );
}
