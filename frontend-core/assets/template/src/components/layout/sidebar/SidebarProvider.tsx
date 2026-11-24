import { useMemo, type ReactNode } from 'react';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SidebarContext } from './sidebar-context';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useLocalStorage('sidebar-collapsed', 'false');
  const { isOpen, open, close } = useDisclosure();
  const isCollapsed = stored === 'true';
  const state = useMemo(
    () => ({
      isCollapsed,
      toggleCollapsed: () => setStored(String(!isCollapsed)),
      isMobileOpen: isOpen,
      openMobile: open,
      closeMobile: close,
    }),
    [isCollapsed, setStored, isOpen, open, close],
  );
  useKeyboardShortcut('b', state.toggleCollapsed);
  return <SidebarContext value={state}>{children}</SidebarContext>;
}
