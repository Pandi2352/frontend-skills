import { createContext, useContext } from 'react';

export interface SidebarState {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar() {
  const sidebar = useContext(SidebarContext);
  if (!sidebar) throw new Error('useSidebar needs SidebarProvider');
  return sidebar;
}
