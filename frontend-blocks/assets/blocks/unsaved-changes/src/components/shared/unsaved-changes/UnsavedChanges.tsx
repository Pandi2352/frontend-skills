import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useBlocker } from 'react-router';
import { useConfirm } from '@/components/shared/confirm';
import { useStableCallback } from '@/hooks/useStableCallback';

export const unsavedText = {
  title: 'Leave without saving?',
  message: 'Your changes will be lost.',
  leave: 'Leave',
  stay: 'Keep editing',
};

/** Asks before leaving the page or closing the tab. Needs a data router. */
export function useUnsavedChanges(isDirty: boolean) {
  const confirm = useConfirm();
  // Another tab, filter or step of the same page is not leaving.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname);

  const ask = useStableCallback(async () => {
    const leave = await confirm({
      title: unsavedText.title, message: unsavedText.message, confirmLabel: unsavedText.leave, cancelLabel: unsavedText.stay, variant: 'danger',
    });
    if (blocker.state !== 'blocked') return;
    if (leave) blocker.proceed();
    else blocker.reset();
  });
  useEffect(() => {
    if (blocker.state === 'blocked') void ask();
  }, [blocker.state, ask]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);
}

/**
 * Put it inside `Form`. After saving call `form.reset(values)` before you navigate,
 * or it asks although everything is saved.
 */
export function UnsavedChangesGuard() {
  const { control } = useFormContext();
  const { isDirty, isSubmitting } = useFormState({ control });
  useUnsavedChanges(isDirty && !isSubmitting);
  return null;
}
