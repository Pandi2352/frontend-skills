import { LayoutDashboard, Settings, Users } from 'lucide-react';
import type { NavGroup } from '@/components/layout/navigation';
import { ROUTES } from './routes';

// Sidebar, mobile menu and breadcrumbs read this. Replace with the real menu.
export const APP_NAV: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Dashboard', to: ROUTES.home, icon: LayoutDashboard, exact: true },
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        children: [
          { id: 'users-list', label: 'All users', to: ROUTES.users.list, exact: true, permission: 'users.read' },
          { id: 'users-new', label: 'New user', to: ROUTES.users.create, permission: 'users.write' },
        ],
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', to: ROUTES.settings, icon: Settings, permission: 'settings.manage' }],
  },
];
