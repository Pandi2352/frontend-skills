import { Check, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { PopupPanel, usePopup } from '../fields/base';

export interface MenuAction {
  kind?: 'item';
  label: string;
  description?: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  /** Makes it a real link. Add onSelect to navigate without reloading. */
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  /** Shown only, e.g. "Ctrl+K". */
  shortcut?: string;
  /** Makes it a checkbox item that keeps the menu open. */
  checked?: boolean;
}
export type MenuItem = MenuAction | { kind: 'separator' } | { kind: 'label'; label: string };

export interface TriggerProps {
  ref: (node: HTMLElement | null) => void;
  id: string;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
}

export interface DropdownMenuProps {
  items: MenuItem[];
  /** Spread the props on a button. */
  trigger: (props: TriggerProps, open: boolean) => ReactNode;
  /** Above the items, e.g. name and email. */
  header?: ReactNode;
  className?: string;
}

const isAction = (item: MenuItem): item is MenuAction => item.kind === undefined || item.kind === 'item';

export function DropdownMenu({ items, trigger, header, className }: DropdownMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Known only once the popup is really on the page.
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const popup = usePopup({ open, onOpenChange: setOpen, maxHeight: 420 });
  const { setReference } = popup;
  const enabled = items.flatMap((item, i) => (isAction(item) && !item.disabled ? [i] : []));

  const show = (from: 'first' | 'last') => {
    setActive((from === 'first' ? enabled[0] : enabled.at(-1)) ?? -1);
    setOpen(true);
  };
  useEffect(() => {
    if (menu && active >= 0) document.getElementById(`${id}-${active}`)?.focus();
  }, [menu, active, id]);

  // Focus goes back before the action, so a Modal it opens can return it here.
  const close = () => {
    setOpen(false);
    document.getElementById(`${id}-trigger`)?.focus();
  };
  const move = (by: number) => {
    const at = enabled.indexOf(active);
    setActive(enabled[(at + by + enabled.length) % enabled.length] ?? -1);
  };
  const onMenuKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Home: () => setActive(enabled[0] ?? -1),
      End: () => setActive(enabled.at(-1) ?? -1),
      Tab: close,
    };
    const run = keys[event.key];
    if (run) {
      event.preventDefault();
      run();
    } else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey) {
      const at = enabled.indexOf(active);
      const order = [...enabled.slice(at + 1), ...enabled.slice(0, at + 1)];
      const found = order.find((i) => {
        const item = items[i];
        return item && isAction(item) && item.label.toLowerCase().startsWith(event.key.toLowerCase());
      });
      if (found !== undefined) setActive(found);
    }
  };
  const choose = (item: MenuAction, event: MouseEvent) => {
    if (item.disabled) return event.preventDefault();
    // New tab and similar clicks on links stay native.
    if (item.href && (event.ctrlKey || event.metaKey || event.shiftKey)) return;
    if (item.href && item.onSelect) event.preventDefault();
    if (item.checked === undefined) close();
    item.onSelect?.();
  };

  return (
    <>
      {trigger(
        {
          ref: setReference,
          id: `${id}-trigger`,
          onClick: () => (open ? setOpen(false) : show('first')),
          onKeyDown: (event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            show(event.key === 'ArrowDown' ? 'first' : 'last');
          },
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? id : undefined,
        },
        open,
      )}
      <PopupPanel popup={popup} initialFocus={-1} className={cn('min-w-48', className)}>
        {header && <div className="border-b border-line px-3 py-2">{header}</div>}
        <div ref={setMenu} id={id} role="menu" tabIndex={-1} aria-labelledby={`${id}-trigger`} onKeyDown={onMenuKeyDown} className="p-1">
          {items.map((item, i) => {
            if (item.kind === 'separator') return <div key={`s${i}`} role="separator" className="my-1 border-t border-line" />; // scan-ok: separators never move
            if (item.kind === 'label')
              return (
                <div key={item.label} role="presentation" className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                  {item.label}
                </div>
              );
            const Icon = item.icon;
            const shared = {
              id: `${id}-${i}`,
              role: item.checked === undefined ? 'menuitem' : 'menuitemcheckbox',
              'aria-checked': item.checked,
              'aria-disabled': item.disabled || undefined,
              tabIndex: -1,
              onMouseEnter: () => !item.disabled && setActive(i),
              onClick: (event: MouseEvent) => choose(item, event),
              className: cn(
                'flex min-h-control w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-none focus-visible:bg-subtle',
                i === active && 'bg-subtle',
                item.danger && 'text-danger',
                item.disabled && 'cursor-not-allowed text-muted opacity-60',
              ),
            };
            const content = (
              <>
                {item.checked !== undefined && (
                  <Check aria-hidden className={cn('size-4 shrink-0', !item.checked && 'invisible')} />
                )}
                {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.description && <span className="block text-xs text-muted">{item.description}</span>}
                </span>
                {item.shortcut && <kbd className="text-xs text-muted">{item.shortcut}</kbd>}
              </>
            );
            return item.href && !item.disabled ? (
              <a key={item.label} {...shared} href={item.href}>
                {content}
              </a>
            ) : (
              <button key={item.label} type="button" {...shared}>
                {content}
              </button>
            );
          })}
        </div>
      </PopupPanel>
    </>
  );
}
