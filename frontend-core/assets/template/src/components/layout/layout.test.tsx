import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutDashboard, Users } from 'lucide-react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from '@/app/layouts/AppLayout';
import { ConfirmProvider } from '@/components/shared/confirm';
import { NavbarSearch, NotificationMenu, UserMenu } from './navbar';
import { filterNav, isActive, type NavGroup } from './navigation';
import { PageHeader } from './page';

const nav: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
      {
        id: 'users', label: 'Users', icon: Users,
        children: [
          { id: 'all', label: 'All users', to: '/users', exact: true },
          { id: 'new', label: 'New user', to: '/users/new', permission: 'users.write' },
        ],
      },
    ],
  },
  { id: 'admin', label: 'Admin', items: [{ id: 'secret', label: 'Secret', to: '/secret', permission: 'admin' }] },
];
beforeEach(() => localStorage.clear());

const search = vi.fn();
const signOut = vi.fn();
function start(path = '/', can: (p: string) => boolean = () => true) {
  render(
    <ConfirmProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout nav={nav} can={can} header="My app" navbar={{ center: <NavbarSearch onOpen={search} />, right: <UserMenu user={{ name: 'Asha Rao', email: 'a@b.co' }} onSignOut={signOut} /> }} />}>
            <Route path="/" element={<PageHeader title="Home" />} />
            <Route path="/users" element={<PageHeader title="People" breadcrumb={[{ label: 'Home', to: '/' }, { label: 'People' }]} />} />
            <Route path="/secret" element={<p>Secret page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ConfirmProvider>,
  );
}
const menu = () => within(screen.getAllByRole('navigation', { name: 'Main menu' })[0] as HTMLElement);

describe('navigation', () => {
  it('hides what is not allowed, with empty groups', () => {
    const shown = filterNav(nav, () => false);
    expect(shown.map((g) => g.id)).toEqual(['main']);
    expect(shown[0]?.items[1]?.children?.map((c) => c.id)).toEqual(['all']);
  });
  it('knows the active item', () => {
    expect(isActive({ id: 'x', label: 'X', to: '/users' }, '/users/5')).toBe(true);
    expect(isActive({ id: 'x', label: 'X', to: '/users' }, '/users-old')).toBe(false);
    expect(isActive({ id: 'x', label: 'X', to: '/' }, '/users')).toBe(false);
    expect(isActive({ id: 'x', label: 'X', to: '/users', exact: true }, '/users/5')).toBe(false);
  });
});

describe('app shell', () => {
  it('opens the parent of the current page and marks it', () => {
    start('/users');
    expect(menu().getByRole('button', { name: 'Users' })).toHaveAttribute('aria-expanded', 'true');
    expect(menu().getByRole('link', { name: 'All users' })).toHaveAttribute('aria-current', 'page');
    expect(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('People')).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe('People · My app');
  });

  it('navigates and moves focus to the page', async () => {
    const user = userEvent.setup();
    start('/');
    await user.click(menu().getByRole('button', { name: 'Users' }));
    await user.click(menu().getByRole('link', { name: 'All users' }));
    expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('collapses, remembers it, and opens children in a menu', async () => {
    const user = userEvent.setup();
    start('/');
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
    expect(menu().getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    await user.click(menu().getByRole('button', { name: 'Users' }));
    await user.click(screen.getByRole('menuitem', { name: 'All users' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await user.keyboard('{Control>}b{/Control}');
    expect(localStorage.getItem('sidebar-collapsed')).toBe('false');
  });

  it('mobile menu opens as a dialog and closes after navigation', async () => {
    const user = userEvent.setup();
    start('/');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Main menu' });
    await user.click(within(dialog).getByRole('link', { name: 'Secret' }));
    expect(screen.getByText('Secret page')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('has a skip link, search shortcut and user menu', async () => {
    const user = userEvent.setup();
    start('/', () => false);
    expect(screen.queryByText('Admin')).toBeNull();
    await user.tab();
    expect(screen.getByText('Skip to main content')).toHaveFocus();
    await user.keyboard('{Control>}k{/Control}');
    expect(search).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Account: Asha Rao' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalled();
  });

  it('NotificationMenu lists, opens and shows empty', async () => {
    const user = userEvent.setup();
    const onOpenItem = vi.fn();
    const item = { id: '1', title: 'New order', read: false };
    const { rerender } = render(<NotificationMenu items={[item]} unreadCount={1} onOpenItem={onOpenItem} />);
    await user.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
    await user.click(screen.getByRole('button', { name: /New order/ }));
    expect(onOpenItem).toHaveBeenCalledWith(item);
    rerender(<NotificationMenu items={[]} unreadCount={0} onOpenItem={onOpenItem} />);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('You have no notifications')).toBeVisible();
  });
});
