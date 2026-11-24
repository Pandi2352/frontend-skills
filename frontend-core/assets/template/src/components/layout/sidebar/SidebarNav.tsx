import { ChevronDown, ExternalLink } from 'lucide-react';
import { useId, useState } from 'react';
import { NavLink, useHref, useLocation, useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { isActive, type NavGroup, type NavItem } from '../navigation';

const rowClass = (active: boolean, collapsed: boolean) =>
  cn(
    'relative flex min-h-control w-full items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
    collapsed && 'justify-center px-0',
    active
      ? 'bg-primary-subtle font-medium text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-primary'
      : 'text-foreground hover:bg-subtle',
  );

function RowContent({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <>
      {Icon ? (
        <Icon aria-hidden className="size-5 shrink-0" />
      ) : (
        collapsed && <span aria-hidden>{item.label.slice(0, 1)}</span>
      )}
      <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate text-start'} title={collapsed ? undefined : item.label}>
        {item.label}
      </span>
      {item.badge !== undefined && !collapsed && <Badge size="sm">{item.badge}</Badge>}
      {item.external && !collapsed && <ExternalLink aria-hidden className="size-4 text-muted" />}
    </>
  );
}

interface RowProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}

function Leaf({ item, collapsed, onNavigate }: RowProps) {
  const { pathname } = useLocation();
  const link = item.external ? (
    <a href={item.external} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={rowClass(false, collapsed)}>
      <RowContent item={item} collapsed={collapsed} />
    </a>
  ) : (
    <NavLink to={item.to ?? '/'} end={!!item.exact} onClick={onNavigate} className={rowClass(isActive(item, pathname), collapsed)}>
      <RowContent item={item} collapsed={collapsed} />
    </NavLink>
  );
  return (
    <Tooltip text={item.label} placement="right" disabled={!collapsed} className="flex">
      {link}
    </Tooltip>
  );
}

function Parent({ item, collapsed, onNavigate }: RowProps) {
  const id = useId();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const base = useHref('/').replace(/\/$/, '');
  const active = isActive(item, pathname);
  // Opens for the current page until the person decides otherwise.
  const [choice, setChoice] = useState<boolean>();
  const open = choice ?? active;
  const children = item.children ?? [];

  if (collapsed) {
    return (
      <DropdownMenu
        items={[
          { kind: 'label', label: item.label },
          ...children.map((child) => ({
            label: child.label,
            ...(child.icon ? { icon: child.icon } : {}),
            href: child.external ?? `${base}${child.to ?? '/'}`,
            ...(child.external ? {} : { onSelect: () => void navigate(child.to ?? '/') }),
          })),
        ]}
        trigger={(props) => (
          <button type="button" {...props} className={rowClass(active, true)}>
            <RowContent item={item} collapsed />
          </button>
        )}
      />
    );
  }
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setChoice(!open)}
        className={cn(rowClass(false, false), active && 'font-medium text-primary')}
      >
        <RowContent item={item} collapsed={false} />
        <ChevronDown aria-hidden className={cn('size-4 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>
      <ul id={id} hidden={!open} className="mt-0.5 ml-5 flex flex-col gap-0.5 border-l border-line pl-2">
        {children.map((child) => (
          <li key={child.id}>
            <Row item={child} collapsed={false} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Row(props: RowProps) {
  return props.item.children ? <Parent {...props} /> : <Leaf {...props} />;
}

export interface SidebarNavProps {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ groups, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label={uiText.mainMenu} className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.id}>
          {group.label && (
            <p className={cn('px-3 pb-1 text-xs font-medium text-muted', collapsed && 'sr-only')}>{group.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <Row item={item} collapsed={collapsed} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
