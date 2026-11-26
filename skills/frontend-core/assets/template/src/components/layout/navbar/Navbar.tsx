import { Bell, ChevronDown, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { DropdownMenu, type MenuItem } from '@/components/ui/dropdown-menu';
import { PopupPanel, usePopup } from '@/components/ui/fields/base';
import { uiText } from '@/constants/ui-text';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { cn } from '@/lib/cn';
import { AsyncView, EmptyState } from '@/components/shared/states';
import { isActive, type NavGroup, type NavItem } from '../navigation';
import { useSidebar } from '../sidebar';

export interface NavbarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

/** Three slots, so every project fills it differently without new props. */
export function Navbar({ left, center, right, className }: NavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-(--z-navbar) flex h-header shrink-0 items-center gap-2 border-b border-line bg-surface px-3 md:px-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">{left}</div>
      <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
      <div className="flex items-center gap-1">{right}</div>
    </header>
  );
}

/** At the left end of the navbar: collapses the sidebar, or opens it as a drawer on phones. Ctrl/Cmd+B. */
export function SidebarToggle() {
  const { openMobile, isMobileOpen, isCollapsed, toggleCollapsed } = useSidebar();
  return (
    <>
      <IconButton icon={Menu} label={uiText.openMenu} aria-expanded={isMobileOpen} aria-haspopup="dialog" className="lg:hidden" onClick={openMobile} />
      <IconButton
        icon={isCollapsed ? PanelLeftOpen : PanelLeftClose}
        label={isCollapsed ? uiText.expand : uiText.collapse}
        aria-expanded={!isCollapsed}
        className="hidden text-muted lg:inline-flex"
        onClick={toggleCollapsed}
      />
    </>
  );
}
/** @deprecated SidebarToggle does both. */
export const MobileMenuButton = SidebarToggle;

/** Where the current page is in the menu: group, parent, page. From md up. */
export function NavTrail({ groups }: { groups: NavGroup[] }) {
  const { pathname } = useLocation();
  let trail: { label: string; to?: string | undefined }[] = [];
  for (const group of groups) {
    const find = (items: NavItem[], above: NavItem[]): NavItem[] | null => {
      for (const item of items) {
        if (item.children) {
          const found = find(item.children, [...above, item]);
          if (found) return found;
        } else if (isActive(item, pathname)) return [...above, item];
      }
      return null;
    };
    const found = find(group.items, []);
    if (found) {
      trail = [...(group.label ? [{ label: group.label }] : []), ...found.map((i) => ({ label: i.label, to: i.children ? undefined : i.to }))];
      break;
    }
  }
  if (!trail.length) return null;
  return (
    <nav aria-label={uiText.location} className="hidden min-w-0 md:block">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {trail.map((step, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={step.label + String(i)} className={cn('flex min-w-0 items-center gap-1.5', last ? 'font-medium text-foreground' : 'text-muted')}>
              {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-placeholder" />}
              {step.to && !last ? (
                <Link to={step.to} className="truncate rounded-md hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus">
                  {step.label}
                </Link>
              ) : (
                <span className="truncate" aria-current={last ? 'page' : undefined}>
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Opens search or a command menu; also Ctrl/Cmd+K. An icon on phones. */
export function NavbarSearch({ onOpen, label = uiText.search }: { onOpen: () => void; label?: string }) {
  useKeyboardShortcut('k', onOpen);
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="hidden h-control w-full max-w-md items-center gap-2 rounded-md border border-control-line bg-surface px-3 text-sm text-muted hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:flex"
      >
        <Search aria-hidden className="size-4" />
        <span className="flex-1 text-start">{label}</span>
        <kbd aria-hidden className="text-xs">
          Ctrl K
        </kbd>
      </button>
      <IconButton icon={Search} label={label} className="ms-auto md:hidden" onClick={onOpen} />
    </>
  );
}

export interface UserMenuProps {
  user: { name: string; email: string; avatarUrl?: string | undefined; role?: string | undefined };
  /** Profile, settings and so on. */
  items?: MenuItem[];
  signOutLabel?: string;
  onSignOut: () => void;
}

export function UserMenu({ user, items = [], signOutLabel = 'Sign out', onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu
      header={
        <div className="max-w-56 text-sm">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-muted">{user.email}</p>
        </div>
      }
      items={[...items, ...(items.length ? [{ kind: 'separator' } as const] : []), { label: signOutLabel, icon: LogOut, onSelect: onSignOut }]}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={uiText.account(user.name)}
          className="flex items-center gap-2 rounded-md p-1 hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:pe-2"
        >
          <Avatar decorative size="sm" name={user.name} src={user.avatarUrl} />
          <span aria-hidden className="hidden max-w-40 text-start leading-tight md:block">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            {user.role && <span className="block truncate text-xs text-muted capitalize">{user.role}</span>}
          </span>
          <ChevronDown aria-hidden className="hidden size-4 text-muted md:block" />
        </button>
      )}
    />
  );
}

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  read: boolean;
}

export interface NotificationMenuProps {
  items: NotificationItem[] | undefined;
  unreadCount: number;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onOpenItem: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
}

export function NotificationMenu(props: NotificationMenuProps) {
  const { items, unreadCount, isLoading = false, error, onRetry, onOpenItem, onMarkAllRead, onViewAll } = props;
  const [open, setOpen] = useState(false);
  const popup = usePopup({ open, onOpenChange: setOpen, maxHeight: 480 });
  const { setReference, getReferenceProps } = popup;
  return (
    <>
      <span ref={setReference} className="relative inline-flex">
        <IconButton
          icon={Bell}
          label={uiText.unread(unreadCount)}
          {...getReferenceProps({ onClick: () => setOpen(!open) })}
          aria-haspopup="dialog"
          aria-expanded={open}
        />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0.5 end-0.5 min-w-4 rounded-full bg-danger px-1 text-center text-xs leading-4 text-on-danger"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      <PopupPanel popup={popup} role="dialog" aria-label={uiText.notifications} className="w-80">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <p className="font-medium">{uiText.notifications}</p>
          {onMarkAllRead && unreadCount > 0 && (
            <Button size="sm" variant="link" className="px-0" onClick={onMarkAllRead}>
              {uiText.markAllRead}
            </Button>
          )}
        </div>
        <AsyncView
          data={items}
          isLoading={isLoading}
          error={error}
          {...(onRetry ? { onRetry } : {})}
          isEmpty={(list) => list.length === 0}
          empty={<EmptyState icon={Bell} title={uiText.noNotifications} />}
        >
          {(list) => (
            <ul>
              {list.map((item) => (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenItem(item);
                    }}
                    className="flex w-full gap-2 px-3 py-2 text-start hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                  >
                    <span className="pt-1.5">
                      <span aria-hidden className={cn('block size-2 rounded-full', !item.read && 'bg-primary')} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block break-words', !item.read && 'font-medium')}>
                        {item.title}
                        {!item.read && <span className="sr-only"> ({uiText.unreadItem})</span>}
                      </span>
                      {item.description && <span className="block text-muted">{item.description}</span>}
                      {item.time && <span className="block text-xs text-muted">{item.time}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
        {onViewAll && (
          <div className="border-t border-line p-2">
            <Button
              size="sm"
              variant="ghost"
              fullWidth
              onClick={() => {
                setOpen(false);
                onViewAll();
              }}
            >
              {uiText.viewAll}
            </Button>
          </div>
        )}
      </PopupPanel>
    </>
  );
}
