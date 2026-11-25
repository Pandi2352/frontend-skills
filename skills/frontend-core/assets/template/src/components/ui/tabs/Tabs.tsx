import type { LucideIcon } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Beside the label, e.g. a count. */
  badge?: ReactNode;
  disabled?: boolean;
  content: ReactNode;
}

export interface TabsProps {
  /** Names the group for screen readers. */
  label: string;
  items: TabItem[];
  /** Controlled. With `useUrlState` the tab stays in the address. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  /** Keeps visited panels, so half-filled forms are not lost. */
  keepMounted?: boolean;
  className?: string;
}

/** Arrow keys, Home and End move; panels are drawn only when opened. */
export function Tabs(props: TabsProps) {
  const { label, items, orientation = 'horizontal', keepMounted = false, className } = props;
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const [value, setValue] = useControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? items.find((t) => !t.disabled)?.id ?? '',
    onChange: props.onChange,
  });
  // An unknown id, for example from an old link, opens the first tab.
  const usable = items.filter((t) => !t.disabled);
  const active = usable.find((t) => t.id === value) ?? usable[0];
  const [visited, setVisited] = useState<string[]>([]);
  if (active && !visited.includes(active.id)) setVisited([...visited, active.id]);
  const vertical = orientation === 'vertical';

  const onKeyDown = (event: KeyboardEvent) => {
    const at = usable.findIndex((t) => t.id === active?.id);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const steps: Record<string, number> = {
      [next]: (at + 1) % usable.length,
      [back]: (at - 1 + usable.length) % usable.length,
      Home: 0,
      End: usable.length - 1,
    };
    const target = usable[steps[event.key] ?? -1];
    if (!target) return;
    event.preventDefault();
    setValue(target.id);
    const button = list.current?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(target.id)}"]`);
    button?.focus();
    button?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-4', vertical && 'md:flex-row md:gap-6', className)}>
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          'flex shrink-0 overflow-x-auto border-b border-line',
          vertical && 'md:w-56 md:flex-col md:overflow-visible md:border-e md:border-b-0',
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${id}-${tab.id}-tab`}
              data-tab={tab.id}
              aria-selected={isActive}
              aria-controls={isActive || (keepMounted && visited.includes(tab.id)) ? `${id}-${tab.id}` : undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => setValue(tab.id)}
              className={cn(
                'flex min-h-control shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50',
                vertical && 'md:border-e-2 md:border-b-0',
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground',
              )}
            >
              {tab.icon && <tab.icon aria-hidden className="size-4" />}
              {tab.label}
              {tab.badge}
            </button>
          );
        })}
      </div>
      {items
        .filter((t) => t.id === active?.id || (keepMounted && visited.includes(t.id)))
        .map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${id}-${tab.id}`}
            aria-labelledby={`${id}-${tab.id}-tab`}
            tabIndex={0}
            hidden={tab.id !== active?.id}
            className="min-w-0 flex-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {tab.content}
          </div>
        ))}
    </div>
  );
}
