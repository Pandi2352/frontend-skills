import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  /** At the end of the header, e.g. a status badge. */
  extra?: ReactNode;
  disabled?: boolean;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Several may be open together. */
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onChange?: (open: string[]) => void;
  /** Heading level of the titles, to fit the page. */
  level?: 2 | 3 | 4;
  className?: string;
}

const headings = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export function Accordion(props: AccordionProps) {
  const { items, multiple = false, level = 3, className } = props;
  const id = useId();
  const [open, setOpen] = useControllableState<string[]>({
    value: props.value, defaultValue: props.defaultValue ?? [], onChange: props.onChange,
  });
  const Heading = headings[level];

  const toggle = (item: string) => {
    if (open.includes(item)) setOpen(open.filter((o) => o !== item));
    else setOpen(multiple ? [...open, item] : [item]);
  };

  return (
    <div className={cn('divide-y divide-line rounded-md border border-line bg-surface', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <Heading className="flex items-center">
              <button
                type="button"
                id={`${id}-${item.id}-title`}
                aria-expanded={isOpen}
                aria-controls={`${id}-${item.id}`}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                className="flex min-h-control-lg min-w-0 flex-1 items-center gap-3 rounded-md px-4 py-2 text-start text-sm font-medium hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:text-muted"
              >
                <span className="min-w-0 flex-1 break-words">{item.title}</span>
                <ChevronDown aria-hidden className={cn('size-4 shrink-0 transition-transform duration-150', isOpen && 'rotate-180')} />
              </button>
              {item.extra && <span className="shrink-0 pe-4">{item.extra}</span>}
            </Heading>
            {/* Stays in the page, so form values are kept. */}
            <div id={`${id}-${item.id}`} role="region" aria-labelledby={`${id}-${item.id}-title`} hidden={!isOpen} className="px-4 pt-1 pb-4 text-sm">
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
