import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { DashboardPage } from './pages/DashboardPage';
import { dashboardService, type DashboardData } from './services/dashboard.service';

vi.setConfig({ testTimeout: 30_000 });
vi.mock('./services/dashboard.service', async (original) => ({
  ...(await original<typeof import('./services/dashboard.service')>()),
  dashboardService: { get: vi.fn() },
}));
const get = vi.mocked(dashboardService.get);
beforeEach(() => vi.resetAllMocks());
const data: DashboardData = {
  revenue: { value: 1200, change: 0.1 }, orders: { value: 30 }, customers: { value: 4 }, refunds: { value: 50, change: -0.2 },
  trend: [{ label: 'Mon', values: { revenue: 10, refunds: 1 } }],
  categories: [{ id: 'a', label: 'Books', value: 10 }],
  recent: [{ id: '1', customer: 'Asha', total: 20, status: 'paid', date: '2026-01-05' }],
};
const start = () => {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><DashboardPage /></MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
};

it('shows the numbers, and loads again for another period', async () => {
  get.mockResolvedValue(data);
  const user = start();
  expect(await screen.findByText('$1,200')).toBeVisible();
  expect(within(screen.getByRole('table', { name: 'Recent orders' })).getByText('Asha')).toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: '12 months' }));
  expect(get).toHaveBeenLastCalledWith('12m', expect.anything());
  expect(screen.getByText('$1,200')).toBeVisible();
});

it('shows one error with a retry', async () => {
  get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(data);
  const user = start();
  await user.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('$1,200')).toBeVisible();
});
