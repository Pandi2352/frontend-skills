import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAutosave } from './useAutosave';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

const setup = (save: (v: string) => Promise<unknown>, enabled = true) =>
  renderHook((p: { value: string; enabled: boolean }) => useAutosave({ ...p, save }), { initialProps: { value: 'a', enabled } });

it('saves once after the last change, and nothing without a change', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const { rerender, result } = setup(save);
  await pass(5000);
  expect(save).not.toHaveBeenCalled();
  rerender({ value: 'b', enabled: true });
  await pass(500);
  rerender({ value: 'c', enabled: true });
  expect(result.current.state).toBe('waiting');
  await pass(1000);
  expect(save.mock.calls.map((c) => c[0])).toEqual(['c']);
  expect(result.current.state).toBe('saved');
});

it('never overlaps: a change during a save is saved after it', async () => {
  const finish: (() => void)[] = [];
  const save = vi.fn(() => new Promise<void>((done) => finish.push(done)));
  const { rerender, result } = setup(save);
  rerender({ value: 'b', enabled: true });
  await pass(1000);
  rerender({ value: 'c', enabled: true });
  await pass(3000);
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => finish[0]?.());
  expect(save).toHaveBeenLastCalledWith('c', expect.anything());
  await act(async () => finish[1]?.());
  expect(result.current.state).toBe('saved');
});

it('shows a failure, retries, and does not save invalid values', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const { rerender, result } = setup(save);
  rerender({ value: 'b', enabled: false });
  await pass(5000);
  expect(save).not.toHaveBeenCalled();
  rerender({ value: 'b', enabled: true });
  await pass(1000);
  expect(result.current.state).toBe('failed');
  await act(async () => result.current.saveNow());
  expect(result.current.state).toBe('saved');
});

it('sends what is waiting when the page is left', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const { rerender, unmount } = setup(save);
  rerender({ value: 'b', enabled: true });
  unmount();
  expect(save).toHaveBeenCalledWith('b', expect.anything());
});
