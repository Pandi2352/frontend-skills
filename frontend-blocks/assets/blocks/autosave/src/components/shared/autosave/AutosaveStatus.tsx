import { Check, CloudOff, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loader';
import { appConfig } from '@/config/app.config';
import { uiText } from '@/constants/ui-text';
import type { AutosaveState } from '@/hooks/useAutosave';

export const autosaveText = {
  saved: 'All changes saved',
  savedAt: (time: string) => `Saved at ${time}`,
  waiting: 'Not saved yet',
  saving: 'Saving…',
  failed: 'Could not save',
};

export function AutosaveStatus({ state, savedAt, onRetry }: { state: AutosaveState; savedAt: Date | null; onRetry: () => void }) {
  const time = savedAt && new Intl.DateTimeFormat(appConfig.locale, { timeStyle: 'short' }).format(savedAt);
  const text = state === 'saved' && time ? autosaveText.savedAt(time) : autosaveText[state];
  return (
    <div className="flex min-h-control-sm items-center gap-2 text-sm text-muted">
      {state === 'saving' && <Spinner />}
      {state === 'saved' && <Check aria-hidden className="size-4" />}
      {state === 'waiting' && <Pencil aria-hidden className="size-4" />}
      {state === 'failed' && <CloudOff aria-hidden className="size-4 text-danger" />}
      {/* Announced only at the end, not for every key. */}
      <span role="status" className={state === 'failed' ? 'text-danger' : undefined}>
        {state === 'waiting' || state === 'saving' ? <span aria-hidden>{text}</span> : text}
      </span>
      {state === 'failed' && (
        <Button size="sm" variant="link" className="px-0" onClick={onRetry}>
          {uiText.retry}
        </Button>
      )}
    </div>
  );
}
