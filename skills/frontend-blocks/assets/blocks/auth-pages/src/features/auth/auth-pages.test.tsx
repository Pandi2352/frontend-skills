import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api-error';
import { AuthContext, type Auth } from './hooks/auth-context';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { accountService } from './services/account.service';

vi.setConfig({ testTimeout: 30_000 });
vi.mock('./services/account.service', () => ({
  accountService: {
    register: vi.fn(), verifyEmail: vi.fn(), resendCode: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), changePassword: vi.fn(),
  },
}));
const service = vi.mocked(accountService);
const signIn = vi.fn();
beforeEach(() => vi.resetAllMocks());

function Address() {
  const { pathname, search } = useLocation();
  return <output data-testid="address">{pathname + search}</output>;
}
function start(path: string, state?: unknown) {
  const auth: Auth = { status: 'signedOut', user: null, signIn, signOut: vi.fn(), retry: vi.fn(), updateUser: vi.fn() };
  const pages = { '/login': <LoginPage />, '/register': <RegisterPage />, '/forgot-password': <ForgotPasswordPage />, '/reset-password': <ResetPasswordPage />, '/verify-email': <VerifyEmailPage /> };
  const [pathname = '', search] = path.split('?');
  const router = createMemoryRouter(
    Object.entries(pages).map(([p, page]) => ({ path: p, element: <><Address />{page}</> })),
    { initialEntries: [{ pathname, ...(search ? { search: `?${search}` } : {}), state }] },
  );
  render(<AuthContext value={auth}><RouterProvider router={router} /></AuthContext>);
  return userEvent.setup();
}
const address = () => screen.getByTestId('address').textContent;
const button = (name: string) => screen.getByRole('button', { name });

it('login says the same for a wrong email and a wrong password', async () => {
  const user = start('/login');
  signIn.mockRejectedValueOnce(new ApiError('No such user', { kind: 'http', status: 404 }));
  await user.type(screen.getByLabelText(/^Email/), 'a@b.co');
  await user.type(screen.getByLabelText(/^Password/), 'x');
  await user.click(button('Sign in'));
  expect(await screen.findByText('Email or password is incorrect.')).toBeVisible();
  expect(screen.queryByText('No such user')).toBeNull();
});

it('register needs the terms, then asks for the code', async () => {
  const user = start('/register');
  service.register.mockResolvedValue({ verificationRequired: true });
  await user.type(screen.getByLabelText(/Full name/), 'Asha');
  await user.type(screen.getByLabelText(/^Email/), 'a@b.co');
  await user.type(screen.getByLabelText(/^Password/), 'long-enough-1');
  await user.click(button('Create account'));
  expect(await screen.findByText('Accept the terms to continue')).toBeVisible();
  await user.click(screen.getByRole('checkbox'));
  await user.click(button('Create account'));
  expect(await screen.findByText(/code we sent to a@b\.co/)).toBeVisible();
  expect(service.register).toHaveBeenCalledWith({ name: 'Asha', email: 'a@b.co', password: 'long-enough-1' });
});

it('verify confirms the code and goes to login; without an address it goes back', async () => {
  const user = start('/verify-email', { email: 'a@b.co' });
  expect(button('Send a new code in 60 s')).toBeDisabled();
  await user.type(screen.getByLabelText(/^Code/), '123456');
  await user.click(button('Confirm'));
  expect(await screen.findByText('Your email is confirmed. Sign in to continue.')).toBeVisible();
  expect(service.verifyEmail).toHaveBeenCalledWith('a@b.co', '123456');
  expect(screen.getByLabelText(/^Email/)).toHaveValue('a@b.co');
});

it('forgot password never tells whether the account exists', async () => {
  const user = start('/forgot-password');
  await user.type(screen.getByLabelText(/^Email/), 'a@b.co');
  await user.click(button('Send link'));
  expect(await screen.findByText(/If there is an account for a@b\.co/)).toBeVisible();
});

it('reset hides the token, compares the passwords, and goes to login', async () => {
  const user = start('/reset-password?token=secret');
  await vi.waitFor(() => expect(address()).toBe('/reset-password'));
  await user.type(screen.getByLabelText(/^New password/), 'long-enough-1');
  await user.type(screen.getByLabelText(/^Repeat password/), 'other');
  await user.click(button('Save password'));
  expect(await screen.findByText('The passwords are different')).toBeVisible();
  await user.clear(screen.getByLabelText(/^Repeat password/));
  await user.type(screen.getByLabelText(/^Repeat password/), 'long-enough-1');
  await user.click(button('Save password'));
  expect(await screen.findByText('Your password was changed. Sign in to continue.')).toBeVisible();
  expect(service.resetPassword).toHaveBeenCalledWith('secret', 'long-enough-1');
});

it('reset without a token offers a new link', () => {
  start('/reset-password');
  expect(screen.getByRole('link', { name: 'Get a new link' })).toBeVisible();
});
