import type { LucideIcon } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { SearchInput } from '@/components/ui/fields/text/SearchInput';
import { Spinner } from '@/components/ui/loader';
import { Modal } from '@/components/ui/modal';
import { uiText } from '@/constants/ui-text';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/cn';

export interface Command {
  id: string;
  label: string;
  /** Title above the commands that share it. */
  group?: string;
  /** Other words people may type. */
  keywords?: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  /** Results from the server for this text; add them to `commands`. */
  onSearch?: (text: string) => void;
  isSearching?: boolean;
  /** Remembers the last used commands under this key. */
  recentKey?: string;
}

const RECENT = 5;
const clean = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function Content({ onClose, commands, onSearch, isSearching, recentKey }: Omit<CommandMenuProps, 'open'>) {
  const id = useId();
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const [stored, setStored] = useLocalStorage(recentKey ?? 'commands', '');
  const recentIds = recentKey && stored ? stored.split(',') : [];

  const words = clean(text).split(/\s+/).filter(Boolean);
  const matches = commands.filter((c) => {
    const all = clean(`${c.label} ${c.keywords ?? ''} ${c.group ?? ''}`);
    return words.every((w) => all.includes(w));
  });
  const recent = words.length ? [] : recentIds.flatMap((r) => commands.find((c) => c.id === r) ?? []);
  const others = matches.filter((c) => !recent.includes(c));
  const groups = new Map<string, Command[]>();
  if (recent.length) groups.set(uiText.recent, recent);
  for (const c of others) groups.set(c.group ?? '', [...(groups.get(c.group ?? '') ?? []), c]);
  // In the order they are drawn, so the arrow keys follow the eye.
  const shown = [...groups.values()].flat();
  const at = Math.min(active, shown.length - 1);
  const optionId = (c: Command) => `${id}-${c.id}`;

  const move = (index: number) => {
    setActive(index);
    const target = shown[index];
    if (target) document.getElementById(optionId(target))?.scrollIntoView?.({ block: 'nearest' });
  };
  const run = (command: Command | undefined) => {
    if (!command) return;
    if (recentKey) setStored([command.id, ...recentIds.filter((r) => r !== command.id)].slice(0, RECENT).join(','));
    onClose();
    command.onSelect();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing || !shown.length) return;
    const moves: Record<string, number> = {
      ArrowDown: (at + 1) % shown.length,
      ArrowUp: (at - 1 + shown.length) % shown.length,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      move(next);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(shown[at]);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <SearchInput
        hideLabel
        label={uiText.commands}
        placeholder={uiText.commands}
        role="combobox"
        aria-expanded
        aria-controls={`${id}-list`}
        aria-activedescendant={shown[at] ? optionId(shown[at]) : undefined}
        value={text}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
        }}
        {...(onSearch ? { onSearch } : {})}
      />
      <div id={`${id}-list`} role="listbox" aria-label={uiText.commands} tabIndex={-1} className="max-h-80 min-h-0 overflow-auto">
        {[...groups].map(([name, list]) => (
          <div key={name} role="group" aria-label={name || uiText.commands}>
            {name && <div aria-hidden className="px-2 pt-2 pb-1 text-xs font-medium text-muted">{name}</div>}
            {list.map((c) => {
              const index = shown.indexOf(c);
              return (
                // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events -- keys are handled on the search box
                <div
                  key={c.id}
                  id={optionId(c)}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === at}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => index !== at && setActive(index)}
                  onClick={() => run(c)}
                  className={cn('flex min-h-control cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm', index === at && 'bg-subtle')}
                >
                  {c.icon && <c.icon aria-hidden className="size-4 shrink-0 text-muted" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{c.label}</span>
                    {c.description && <span className="block truncate text-xs text-muted">{c.description}</span>}
                  </span>
                  {c.shortcut && <kbd className="text-xs text-muted">{c.shortcut}</kbd>}
                </div>
              );
            })}
          </div>
        ))}
        {!shown.length && !isSearching && <p className="p-6 text-center text-sm text-muted">{uiText.noCommands}</p>}
        {isSearching && (
          <div className="flex justify-center p-3">
            <Spinner label={uiText.loading} />
          </div>
        )}
      </div>
      <span role="status" className="sr-only">
        {isSearching ? '' : shown.length ? uiText.results(shown.length) : uiText.noCommands}
      </span>
    </div>
  );
}

/** Opens from `NavbarSearch` (Ctrl/Cmd+K). Starts empty every time. */
export function CommandMenu({ open, ...rest }: CommandMenuProps) {
  return (
    <Modal open={open} onClose={rest.onClose} title={uiText.commands} hideTitle hideClose fullScreenOnMobile>
      <Content {...rest} />
    </Modal>
  );
}
