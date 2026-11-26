import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ConfirmProvider } from '@/components/shared/confirm';
import { AuthContext, type Auth } from '@/features/auth/hooks/auth-context';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { profileService } from './services/profile.service';

vi.setConfig({ testTimeout: 30_000 });
vi.mock('./services/profile.service', () => ({
  profileService: { get: vi.fn(), update: vi.fn(), setAvatar: vi.fn(), removeAvatar: vi.fn(), getPreferences: vi.fn(), setPreferences: vi.fn() },
}));
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }));
const service = vi.mocked(profileService);
const user = { id: '1', name: 'Asha', email: 'a@b.co', role: 'admin' };
const updateUser = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }));
});

function start(page: ReactNode, path = '/') {
  const auth: Auth = { status: 'signedIn', user, signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn(), updateUser };
  const router = createMemoryRouter([{ path: '/', element: page }], { initialEntries: [path] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthContext value={auth}><ConfirmProvider><RouterProvider router={router} /></ConfirmProvider></AuthContext>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

it('saves the profile, keeps the picture, and updates the navbar', async () => {
  service.get.mockResolvedValue({ name: 'Asha', email: 'a@b.co', phone: '', avatarUrl: '/a.png' });
  service.update.mockResolvedValue({ ...user, name: 'Asha Rao' });
  const person = start(<ProfilePage />);
  const name = await screen.findByLabelText(/Full name/);
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await person.type(name, ' Rao');
  await person.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ ...user, name: 'Asha Rao' }));
  expect(service.update).toHaveBeenCalledWith({ name: 'Asha Rao', phone: '' });
  expect(service.setAvatar).not.toHaveBeenCalled();
  expect(service.removeAvatar).not.toHaveBeenCalled();
});

it('does not remove a picture that was never there', async () => {
  service.get.mockResolvedValue({ name: 'Asha', email: 'a@b.co', phone: '', avatarUrl: null });
  service.update.mockResolvedValue(user);
  const person = start(<ProfilePage />);
  await person.type(await screen.findByLabelText(/Full name/), 'x');
  await person.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(service.update).toHaveBeenCalled());
  expect(service.removeAvatar).not.toHaveBeenCalled();
});

it('opens the tab from the address, and undoes a setting that cannot be saved', async () => {
  service.getPreferences.mockResolvedValue({ timezone: 'Asia/Kolkata', emailNews: false, emailActivity: true, desktopAlerts: false });
  service.setPreferences.mockRejectedValue(new Error('offline'));
  const person = start(<SettingsPage />, '/?tab=notifications');
  const news = await screen.findByRole('switch', { name: /News by email/ });
  await person.click(news);
  expect(service.setPreferences).toHaveBeenCalledWith({ emailNews: true });
  await waitFor(() => expect(news).not.toBeChecked());
});
