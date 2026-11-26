import { IconContext } from '@phosphor-icons/react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { NavLink, useHref, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/fields';
import { Tooltip } from '@/components/ui/tooltip';
import { uiText } from '@/constants/ui-text';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/cn';
import { isActive, type NavGroup, type NavItem } from '../navigation';

const rowClass = (active: boolean, collapsed: boolean, child = false) =>
  cn(
    'group/row relative flex w-full items-center gap-3 rounded-md text-sm transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
    child ? 'min-h-8 px-3' : 'min-h-9 px-3',
    collapsed && 'size-10 justify-center px-0',
    active
      ? cn('bg-primary-subtle font-medium text-primary', !child && 'before:absolute before:inset-y-1.5 before:-start-2 before:w-1 before:rounded-e-full before:bg-primary')
      : 'text-muted hover:bg-subtle hover:text-foreground',
  );

function RowContent({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <>
      {Icon ? (
        <Icon aria-hidden className="size-5 shrink-0" />
      ) : (
        collapsed && <span aria-hidden className="text-xs font-semibold">{item.label.slice(0, 2)}</span>
      )}
      <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate text-start'} title={collapsed ? undefined : item.label}>
        {item.label}
      </span>
      {item.badge !== undefined &&
        (collapsed ? (
          <span aria-hidden className="absolute end-1 top-1 size-2 rounded-full bg-primary" />
        ) : (
          <Badge size="sm">{item.badge}</Badge>
        ))}
      {item.external && !collapsed && <ExternalLink aria-hidden className="size-3.5 opacity-60" />}
    </>
  );
}

interface RowProps {
  item: NavItem;
  collapsed: boolean;
  child?: boolean;
  /** While filtering: every parent is open. */
  forceOpen?: boolean;
  onNavigate?: (() => void) | undefined;
}

function Leaf({ item, collapsed, child = false, onNavigate }: RowProps) {
  const { pathname } = useLocation();
  const link = item.external ? (
    <a href={item.external} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={rowClass(false, collapsed, child)}>
      <RowContent item={item} collapsed={collapsed} />
    </a>
  ) : (
    <NavLink to={item.to ?? '/'} end={!!item.exact} onClick={onNavigate} className={rowClass(isActive(item, pathname), collapsed, child)}>
      <RowContent item={item} collapsed={collapsed} />
    </NavLink>
  );
  return (
    <Tooltip text={item.label} placement="right" disabled={!collapsed} className="flex justify-center">
      {link}
    </Tooltip>
  );
}

/** Which parents the person opened or closed; kept across reloads. */
function useOpenParents() {
  const [stored, setStored] = useLocalStorage('sidebar-open', '{}');
  const choices = useMemo<Record<string, boolean>>(() => {
    try {
      return JSON.parse(stored) as Record<string, boolean>;
    } catch {
      return {};
    }
  }, [stored]);
  return [choices, (id: string, open: boolean) => setStored(JSON.stringify({ ...choices, [id]: open }))] as const;
}

function Parent({ item, collapsed, forceOpen = false, onNavigate }: RowProps) {
  const id = useId();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const base = useHref('/').replace(/\/$/, '');
  const [choices, choose] = useOpenParents();
  const active = isActive(item, pathname);
  // Opens for the current page until the person decides otherwise.
  const open = forceOpen || (choices[item.id] ?? active);
  const children = item.children ?? [];

  if (collapsed) {
    return (
      <DropdownMenu
        placement="right-start"
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
          <Tooltip text={item.label} placement="right" className="flex justify-center">
            <button type="button" {...props} className={rowClass(active, true)}>
              <RowContent item={item} collapsed />
            </button>
          </Tooltip>
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
        onClick={() => choose(item.id, !open)}
        className={cn(rowClass(false, false), active && 'font-medium text-foreground')}
      >
        <RowContent item={item} collapsed={false} />
        <ChevronRight aria-hidden className={cn('size-4 shrink-0 opacity-60 transition-transform duration-200', open && 'rotate-90')} />
      </button>
      {/* Grows and shrinks smoothly; closed children cannot be reached. */}
      <div id={id} inert={!open} className={cn('grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <ul className="ms-[1.3rem] flex min-h-0 flex-col gap-0.5 overflow-hidden border-s border-line ps-2 pt-0.5">
          {children.map((child) => (
            <li key={child.id}>
              <Row item={child} collapsed={false} child onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Row(props: RowProps) {
  return props.item.children ? <Parent {...props} /> : <Leaf {...props} />;
}

/** Items whose label (or a child's label) contains the text. */
function filterGroups(groups: NavGroup[], text: string): NavGroup[] {
  const q = text.trim().toLowerCase();
  if (!q) return groups;
  const hit = (item: NavItem) => item.label.toLowerCase().includes(q);
  return groups
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item) => {
        if (hit(item)) return [item];
        const children = item.children?.filter(hit) ?? [];
        return children.length ? [{ ...item, children }] : [];
      }),
    }))
    .filter((group) => group.items.length);
}

const countItems = (groups: NavGroup[]) => groups.reduce((n, g) => n + g.items.reduce((m, i) => m + 1 + (i.children?.length ?? 0), 0), 0);

const duotone = { weight: 'duotone' } as const;

export interface SidebarNavProps {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
  /** A filter field above the menu. Default: from 10 items on. */
  filterable?: boolean;
}

export function SidebarNav({ groups, collapsed = false, onNavigate, filterable }: SidebarNavProps) {
  const [text, setText] = useState('');
  const showFilter = !collapsed && (filterable ?? countItems(groups) >= 10);
  const shown = showFilter ? filterGroups(groups, text) : groups;
  return (
    // Phosphor menu icons in duotone: two tones, so active and hover read at a glance.
    <IconContext.Provider value={duotone}>
    <nav aria-label={uiText.mainMenu} className="flex flex-col gap-5">
      {showFilter && (
        <SearchInput
          value={text}
          debounceMs={0}
          onChange={(event) => setText(event.target.value)}
          onSearch={setText}
          label={uiText.filterMenu}
          hideLabel
          placeholder={uiText.filterMenu}
        />
      )}
      {shown.length === 0 && <p className="px-3 text-sm text-muted">{uiText.noMenuMatch}</p>}
      {shown.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          {group.label &&
            (collapsed ? (
              <span aria-hidden className="mx-auto mb-1 h-px w-6 bg-line" />
            ) : (
              <p className="px-3 text-[0.6875rem] font-semibold tracking-wider text-placeholder uppercase">{group.label}</p>
            ))}
          {group.label && collapsed && <p className="sr-only">{group.label}</p>}
          <ul className={cn('flex flex-col gap-0.5', collapsed && 'items-center')}>
            {group.items.map((item) => (
              <li key={item.id} className={cn(collapsed && 'flex justify-center')}>
                <Row item={item} collapsed={collapsed} forceOpen={!!text.trim()} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
    </IconContext.Provider>
  );
}
