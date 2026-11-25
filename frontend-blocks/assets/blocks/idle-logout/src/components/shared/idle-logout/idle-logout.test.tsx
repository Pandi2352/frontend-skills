import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { IdleLogout } from './index';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

it('warns, stays on request, and signs out after the time', async () => {
  const onLogout = vi.fn();
  const onStay = vi.fn();
  render(<IdleLogout minutes={5} onLogout={onLogout} onStay={onStay} />);
  await pass(3 * 60_000);
  fireEvent.keyDown(document.body, { key: 'a' });
  await pass(3 * 60_000);
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await pass(70_000);
  expect(screen.getByRole('alertdialog')).toBeVisible();
  fireEvent.pointerDown(document.body);
  fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }));
  expect(onStay).toHaveBeenCalled();
  await pass(4 * 60_000 - 5000);
  expect(onLogout).not.toHaveBeenCalled();
  await pass(70_000);
  expect(onLogout).toHaveBeenCalled();
});

it('counts activity in another tab, and time asleep', async () => {
  const onLogout = vi.fn();
  render(<IdleLogout minutes={5} onLogout={onLogout} />);
  await pass(4 * 60_000 + 30_000);
  expect(screen.getByRole('alertdialog')).toBeVisible();
  localStorage.setItem('last-activity', String(Date.now()));
  await pass(1000);
  await pass(1000);
  expect(onLogout).not.toHaveBeenCalled();
  // The computer slept for an hour; the first move must not keep the session.
  vi.setSystemTime(Date.now() + 3_600_000);
  fireEvent.pointerDown(document.body);
  await pass(1000);
  expect(onLogout).toHaveBeenCalled();
});
