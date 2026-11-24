import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '../button';
import { Spinner } from '../loader';
import { toast, toastStore, type ToastItem } from './toast-store';

const looks = {
  success: { icon: CircleCheck, tone: 'text-success' },
  error: { icon: CircleAlert, tone: 'text-danger' },
  warning: { icon: TriangleAlert, tone: 'text-warning' },
  info: { icon: Info, tone: 'text-info' },
};

function usePageHidden() {
  return useSyncExternalStore(
    (run) => {
      document.addEventListener('visibilitychange', run);
      return () => document.removeEventListener('visibilitychange', run);
    },
    () => document.hidden,
    () => false,
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const [held, setHeld] = useState(false);
  const [shift, setShift] = useState(0);
  const startX = useRef<number | null>(null);
  const left = useRef(item.duration);
  const hidden = usePageHidden();
  const paused = held || hidden;

  useEffect(() => {
    left.current = item.duration;
  }, [item.duration, item.version]);

  useEffect(() => {
    if (paused || !Number.isFinite(left.current)) return;
    const started = Date.now();
    const timer = setTimeout(() => toast.dismiss(item.id), left.current);
    return () => {
      clearTimeout(timer);
      left.current = Math.max(1000, left.current - (Date.now() - started));
    };
  }, [paused, item.id, item.version]);

  const look = item.type === 'loading' ? null : looks[item.type];
  const endSwipe = () => {
    if (Math.abs(shift) > 80) toast.dismiss(item.id);
    startX.current = null;
    setShift(0);
  };

  return (
    <li
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      onPointerDown={(event) => {
        if (event.pointerType === 'touch') startX.current = event.clientX;
      }}
      onPointerMove={(event) => {
        if (startX.current !== null) setShift(event.clientX - startX.current);
      }}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      style={shift ? { transform: `translateX(${shift}px)`, opacity: 1 - Math.abs(shift) / 300 } : undefined}
      className="pointer-events-auto flex w-full touch-pan-y items-start gap-3 rounded-md border border-control-line bg-surface p-3 text-sm"
    >
      {item.icon ?? (look ? <look.icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', look.tone)} /> : <Spinner className="mt-0.5" />)}
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words">
          {item.message}
          {item.count > 1 && <span className="text-muted"> ({item.count})</span>}
        </p>
        {item.description && <p className="break-words text-muted">{item.description}</p>}
        {item.action && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => {
              item.action?.onClick();
              toast.dismiss(item.id);
            }}
          >
            {item.action.label}
          </Button>
        )}
      </div>
      {item.type !== 'loading' && (
        <IconButton icon={X} size="sm" className="-m-1" label={uiText.dismiss} onClick={() => toast.dismiss(item.id)} />
      )}
    </li>
  );
}

const positions = {
  'top-right': 'top-0 sm:right-0',
  'top-center': 'top-0 sm:left-1/2 sm:-translate-x-1/2',
  'bottom-right': 'bottom-0 sm:right-0',
  'bottom-center': 'bottom-0 sm:left-1/2 sm:-translate-x-1/2',
};

export interface ToasterProps {
  position?: keyof typeof positions;
  /** Others wait until there is room. */
  max?: number;
}

/** Mount once, near the app root. */
export function Toaster({ position = 'top-right', max = 3 }: ToasterProps) {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.get, toastStore.get);
  const shown = items.slice(0, max);
  const read = (urgent: boolean) =>
    shown
      .filter((t) => (t.type === 'error') === urgent)
      .map((t) => [t.message, t.description].filter(Boolean).join('. '))
      .at(-1);

  return (
    <section
      data-toaster
      aria-label={uiText.notifications}
      aria-live="off"
      className={cn(
        'pointer-events-none fixed inset-x-0 z-(--z-toast) w-full p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:w-96',
        positions[position],
      )}
    >
      {/* Always present, so screen readers notice new text. */}
      <div role="status" className="sr-only">
        {read(false)}
      </div>
      <div role="alert" className="sr-only">
        {read(true)}
      </div>
      <ul className="flex flex-col gap-2">
        {shown.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
