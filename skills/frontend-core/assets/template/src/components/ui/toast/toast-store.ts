import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  id?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  /** Milliseconds. Infinity keeps it until dismissed. */
  duration?: number;
  icon?: ReactNode;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  /** Equal toasts are counted instead of stacked. */
  count: number;
  /** Changes when the timer must start again. */
  version: number;
}

let items: readonly ToastItem[] = [];
let next = 1;
const listeners = new Set<() => void>();
const save = (list: readonly ToastItem[]) => {
  items = list;
  listeners.forEach((run) => run());
};

export const toastStore = {
  get: () => items,
  subscribe: (run: () => void) => {
    listeners.add(run);
    return () => {
      listeners.delete(run);
    };
  },
};

// Important ones stay until the person has read them.
const defaultDuration = (type: ToastType, options: ToastOptions) =>
  options.duration ?? (type === 'error' || type === 'loading' || options.action ? Infinity : 5000);

function show(type: ToastType, message: string, options: ToastOptions = {}): string {
  const same = items.find((t) =>
    options.id
      ? t.id === options.id
      : t.type === type && t.message === message && t.description === options.description && type !== 'loading',
  );
  if (same) {
    save(
      items.map((t) =>
        t === same
          ? {
              id: t.id, ...options, type, message,
              duration: defaultDuration(type, options),
              count: options.id ? t.count : t.count + 1,
              version: t.version + 1,
            }
          : t,
      ),
    );
    return same.id;
  }
  const id = options.id ?? `toast-${next++}`;
  save([...items, { ...options, id, type, message, duration: defaultDuration(type, options), count: 1, version: 0 }]);
  return id;
}

/** Works anywhere, also outside React. */
export const toast = {
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  warning: (message: string, options?: ToastOptions) => show('warning', message, options),
  info: (message: string, options?: ToastOptions) => show('info', message, options),
  loading: (message: string, options?: ToastOptions) => show('loading', message, options),
  /** Changes a toast, e.g. from loading to success. */
  update: (id: string, change: { type: ToastType; message: string } & Omit<ToastOptions, 'id'>) => {
    const { type, message, ...options } = change;
    return show(type, message, { ...options, id });
  },
  dismiss: (id?: string) => save(id ? items.filter((t) => t.id !== id) : []),
  promise: async <T>(
    promise: Promise<T>,
    text: { loading: string; success: string | ((value: T) => string); error: string | ((error: unknown) => string) },
  ): Promise<T> => {
    const id = show('loading', text.loading);
    try {
      const value = await promise;
      show('success', typeof text.success === 'function' ? text.success(value) : text.success, { id });
      return value;
    } catch (error) {
      show('error', typeof text.error === 'function' ? text.error(error) : text.error, { id });
      throw error;
    }
  },
};
