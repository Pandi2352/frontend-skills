import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useApplyTheme } from '@/hooks/useTheme';
import { ThemeField } from './index';

let dark = false;
let change: () => void = () => undefined;
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({
    matches: dark,
    addEventListener: (_: string, run: () => void) => {
      change = run;
    },
    removeEventListener: () => undefined,
  }));
});
afterEach(() => vi.unstubAllGlobals());

function App() {
  useApplyTheme();
  return <ThemeField />;
}

it('follows the device until a theme is chosen, and remembers it', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  expect(document.documentElement.dataset.theme).toBe('light');
  dark = true;
  act(() => change());
  expect(document.documentElement.dataset.theme).toBe('dark');
  await user.click(screen.getByRole('radio', { name: 'Light' }));
  expect(document.documentElement.dataset.theme).toBe('light');
  unmount();
  render(<App />);
  expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  expect(document.documentElement.dataset.theme).toBe('light');
});
