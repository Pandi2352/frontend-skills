import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import { session } from '@/services/session';
import { AuthProvider, CanAccess, GuestRoute, PermissionRoute, ProtectedRoute, useAuth } from './index';
import { authService } from './services/auth.service';
import { safePath } from './utils/safe-path';

vi.mock('./services/auth.service', () => ({
  authService: { restore: vi.fn(), signIn: vi.fn(), signOut: vi.fn() },
}));
const service = vi.mocked(authService);
const viewer = { id: '1', name: 'Asha', email: 'a@b.co', role: 'viewer' };
beforeEach(() => vi.resetAllMocks());

function Login() {
  const { signIn } = useAuth();
  return <button onClick={() => void signIn({ email: 'a', password: 'b' })}>Sign in</button>;
}
function Home() {
  const { user, signOut } = useAuth();
  return (
    <>
      <p>Hello {user?.name}</p>
      <CanAccess permission="users.delete">Delete</CanAccess>
      <button onClick={() => void signOut().catch(() => {})}>Sign out</button>
    </>
  );
}
function start(path: string) {
  const client = new QueryClient();
  client.setQueryData(['secret'], 1);
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<ProtectedRoute loader={<p>Loading</p>} />}>
              <Route path="/" element={<Home />} />
              <Route path="/reports" element={<p>Reports</p>} />
              <Route element={<PermissionRoute permission="settings.manage" />}>
                <Route path="/settings" element={<p>Settings</p>} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}

it('waits for restore, then shows the page', async () => {
  service.restore.mockResolvedValue(viewer);
  start('/');
  expect(screen.getByText('Loading')).toBeVisible();
  expect(await screen.findByText('Hello Asha')).toBeVisible();
  expect(screen.queryByText('Delete')).toBeNull();
});

it('returns to the requested page after login', async () => {
  service.restore.mockResolvedValue(null);
  service.signIn.mockResolvedValue(viewer);
  start('/reports');
  await userEvent.click(await screen.findByText('Sign in'));
  expect(await screen.findByText('Reports')).toBeVisible();
});

it('blocks a page without permission', async () => {
  service.restore.mockResolvedValue(viewer);
  start('/settings');
  expect(await screen.findByRole('alert')).toHaveTextContent('permission');
});

it('offers retry instead of sign out when the server is unreachable', async () => {
  service.restore.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(viewer);
  start('/');
  await userEvent.click(await screen.findByText('Try again'));
  expect(await screen.findByText('Hello Asha')).toBeVisible();
});

it('signs out and clears cached data even if the server fails', async () => {
  service.restore.mockResolvedValue(viewer);
  service.signOut.mockRejectedValue(new Error('offline'));
  const client = start('/');
  await userEvent.click(await screen.findByText('Sign out'));
  expect(await screen.findByText('Sign in')).toBeVisible();
  expect(client.getQueryData(['secret'])).toBeUndefined();
  expect(session.getToken()).toBeNull();
});

it.each([
  ['/a?b=1#c', '/a?b=1#c'], ['//evil.test', '/'], ['/\\evil.test', '/'], ['https://evil.test', '/'],
  ['/..//evil.test', '/'], ['javascript:alert(1)', '/'], [undefined, '/'],
])('safePath(%s) is %s', (input, output) => {
  expect(safePath(input)).toBe(output);
});
