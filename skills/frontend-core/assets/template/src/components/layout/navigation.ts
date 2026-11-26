import type { ComponentType, SVGProps } from 'react';

/** Any icon component: Phosphor (menu default), Lucide, Tabler, your own SVG. */
export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  id: string;
  label: string;
  /** From ROUTES. Leave out for a parent that only opens its children. */
  to?: string;
  icon?: NavIcon;
  children?: NavItem[];
  badge?: string | number;
  permission?: string;
  /** Active only on exactly this path. */
  exact?: boolean;
  /** Full URL that opens in a new tab. */
  external?: string;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

export type CanSee = (permission: string) => boolean;

/** Removes what the person may not see, and parents and groups left empty. */
export function filterNav(groups: NavGroup[], can: CanSee): NavGroup[] {
  const keep = (items: NavItem[]): NavItem[] =>
    items.flatMap((item) => {
      if (item.permission && !can(item.permission)) return [];
      if (!item.children) return [item];
      const children = keep(item.children);
      return children.length ? [{ ...item, children }] : [];
    });
  return groups.map((g) => ({ ...g, items: keep(g.items) })).filter((g) => g.items.length > 0);
}

export function isActive(item: NavItem, path: string): boolean {
  if (item.children?.some((child) => isActive(child, path))) return true;
  if (!item.to) return false;
  return path === item.to || (!item.exact && item.to !== '/' && path.startsWith(`${item.to}/`));
}
