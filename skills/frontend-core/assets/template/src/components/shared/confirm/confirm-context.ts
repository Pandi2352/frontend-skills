import { createContext, useContext, type ReactNode } from 'react';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  /** The person must type this first, for actions that cannot be undone. */
  requireText?: string;
  /** Runs before closing, with a spinner. A failure is shown and keeps it open. */
  onConfirm?: () => void | Promise<void>;
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | null>(null);

/** `if (await confirm({ title: 'Delete user?', variant: 'danger' })) …` */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm needs ConfirmProvider');
  return confirm;
}
