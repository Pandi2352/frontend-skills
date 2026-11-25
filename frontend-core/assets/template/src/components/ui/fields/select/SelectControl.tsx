import { Check, ChevronDown, Plus, type LucideIcon } from 'lucide-react';
import {
  useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref,
} from 'react';
import { Spinner } from '@/components/ui/loader';
import { fieldText } from '@/constants/field-text';
import { cn } from '@/lib/cn';
import {
  ClearButton, HiddenInputs, PopupPanel, frameClass, usePopup, type FieldAria, type FieldState,
  type Option,
} from '../base';
import { Chip } from '../text/TagsInput';

type Value = string | number;

/** Features shared by Dropdown, MultiDropdown, Combobox and every preset. */
export interface SelectFeatures<T extends Value> {
  options?: Option<T>[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  /** Loads options while typing. The signal cancels outdated requests. */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<Option<T>[]>;
  /** Labels for selected values that are not loaded yet. */
  selectedOptions?: Option<T>[];
  /** Lets people add a new option. */
  onCreate?: (text: string) => Option<T> | Promise<Option<T>>;
  emptyText?: string;
  renderOption?: (option: Option<T>) => ReactNode;
  renderValue?: (option: Option<T>) => ReactNode;
  leftIcon?: LucideIcon;
  /** Most options drawn at once. */
  maxVisible?: number;
}

interface SelectControlProps<T extends Value> extends SelectFeatures<T> {
  aria: FieldAria;
  state: FieldState;
  labelId?: string | undefined;
  ariaLabel?: string;
  value: T[];
  onChange: (value: T[]) => void;
  onBlur?: (() => void) | undefined;
  name?: string | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  multiple?: boolean;
  selectAll?: boolean | undefined;
  max?: number | undefined;
  maxChips?: number | undefined;
  /** No border, for use inside another field. */
  bare?: boolean;
  className?: string | undefined;
}

type Row<T extends Value> =
  | { kind: 'all' }
  | { kind: 'option'; option: Option<T> }
  | { kind: 'create'; text: string };

const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Keeps groups together, in the order they first appear. */
function byGroup<T extends Value>(options: Option<T>[]) {
  const groups = new Map<string, Option<T>[]>();
  for (const option of options) {
    const key = option.group ?? '';
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }
  return [...groups.values()].flat();
}

export function SelectControl<T extends Value>(props: SelectControlProps<T>) {
  const {
    aria, state, labelId, ariaLabel, options = [], value, onChange, onBlur, name, ref, multiple,
    selectAll, max, maxChips = Infinity, bare, className, placeholder = fieldText.select,
    clearable, loadOptions, selectedOptions = [], onCreate, emptyText = fieldText.noResults,
    renderOption, renderValue, leftIcon: Left, maxVisible = 300,
  } = props;
  const searchable = props.searchable || !!loadOptions || !!onCreate;
  const editable = !state.disabled && !state.readOnly;

  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  // Known only once the popup is really on the page.
  const [list, setList] = useState<HTMLElement | null>(null);
  const [known, setKnown] = useState<Option<T>[]>([]);
  const [remote, setRemote] = useState<{ query: string; options: Option<T>[] | null }>();
  const [attempt, setAttempt] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const loader = useRef(loadOptions);
  useEffect(() => {
    loader.current = loadOptions;
  });

  const isRemote = !!loadOptions;
  useEffect(() => {
    if (!open || !isRemote) return;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        try {
          const found = await loader.current?.(query, controller.signal);
          if (!controller.signal.aborted) setRemote({ query, options: found ?? [] });
        } catch {
          if (!controller.signal.aborted) setRemote({ query, options: null });
        }
      },
      query ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, attempt, isRemote]);

  const loading = state.loading || (open && isRemote && remote?.query !== query);
  const failed = isRemote && remote?.query === query && remote.options === null;

  const words = normalize(query.trim());
  const matches = byGroup(
    isRemote
      ? (remote?.options ?? [])
      : options.filter(
          (o) => !words || normalize(`${o.label} ${o.badge ?? ''} ${o.keywords ?? ''}`).includes(words),
        ),
  );
  const shown = matches.slice(0, maxVisible);
  const canCreate =
    !!onCreate && !!words && !loading && !matches.some((o) => normalize(o.label) === words);
  const rows: Row<T>[] = [
    ...(multiple && selectAll && !words && shown.length > 0 ? [{ kind: 'all' } as const] : []),
    ...shown.map((option) => ({ kind: 'option', option }) as const),
    ...(canCreate ? [{ kind: 'create', text: query.trim() } as const] : []),
  ];

  const optionFor = (v: T): Option<T> =>
    [...options, ...selectedOptions, ...(remote?.options ?? []), ...known].find(
      (o) => o.value === v,
    ) ?? { value: v, label: String(v) };
  const selected = value.map(optionFor);
  const selectable = options.filter((o) => !o.disabled).map((o) => o.value);
  const allSelected = selectable.length > 0 && selectable.every((v) => value.includes(v));
  const full = multiple && max !== undefined && value.length >= max;

  const isOff = (row: Row<T> | undefined) =>
    !row ||
    (row.kind === 'option' &&
      (!!row.option.disabled || (!!full && !value.includes(row.option.value))));

  const changeOpen = (next: boolean) => {
    if (next && !editable) return;
    setOpen(next);
    if (next) {
      const first = options.findIndex((o) => value.includes(o.value));
      const current = byGroup(options).findIndex((o) => o.value === options[first]?.value);
      setActive(current >= 0 ? current + (multiple && selectAll ? 1 : 0) : 0);
    } else setQuery('');
  };
  const popup = usePopup({ open, onOpenChange: changeOpen, matchWidth: !bare });
  const { setReference, getReferenceProps } = popup;
  const { isPositioned } = popup.context;

  const pick = async (row: Row<T> | undefined) => {
    if (!row || isOff(row)) return;
    if (row.kind === 'all') {
      onChange(allSelected ? value.filter((v) => !selectable.includes(v)) : [...new Set([...value, ...selectable])]);
      return;
    }
    const option = row.kind === 'create' ? await onCreate?.(row.text) : row.option;
    if (!option) return;
    setKnown((old) => [...old, option]);
    if (multiple) {
      onChange(
        value.includes(option.value)
          ? value.filter((v) => v !== option.value)
          : [...value, option.value],
      );
      if (row.kind === 'create') setQuery('');
    } else {
      onChange([option.value]);
      changeOpen(false);
    }
  };

  const step = (from: number, by: 1 | -1) => {
    for (let n = 1; n <= rows.length; n++) {
      const i = (from + by * n + rows.length * n) % rows.length;
      if (!isOff(rows[i])) return i;
    }
    return from;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing || !editable) return;
    const { key } = event;
    if (key === 'Tab') {
      if (open) changeOpen(false);
      return;
    }
    if (key === 'Backspace' && multiple && !query && value.length) {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!open) changeOpen(true);
      else setActive(step(active, key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (open && (key === 'Enter' || (key === ' ' && !searchable))) {
      event.preventDefault();
      void pick(rows[active]);
      return;
    }
    if (open && !searchable && (key === 'Home' || key === 'End')) {
      event.preventDefault();
      setActive(key === 'Home' ? step(-1, 1) : step(rows.length, -1));
      return;
    }
    // Type the first letters to jump to an option.
    if (!searchable && key.length === 1 && key !== ' ' && !event.ctrlKey && !event.metaKey) {
      const recent = event.timeStamp - typed.current.at < 700;
      typed.current = { text: (recent ? typed.current.text : '') + normalize(key), at: event.timeStamp };
      const found = rows.findIndex(
        (r) =>
          r.kind === 'option' && !isOff(r) && normalize(r.option.label).startsWith(typed.current.text),
      );
      if (!open) changeOpen(true);
      if (found >= 0) setActive(found);
    }
  };

  const optionId = (i: number) => `${listId}-${i}`;
  useEffect(() => {
    // Before it is positioned the list has no height limit, so nothing would scroll.
    if (list && isPositioned) document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [list, isPositioned, active, listId]);

  const activeId = open && rows[active] ? optionId(active) : undefined;
  const single = !multiple ? selected[0] : undefined;
  const chips = multiple ? selected.slice(0, maxChips) : [];
  const canClear = clearable && value.length > 0 && editable;

  const trigger = (
    <button
      {...aria}
      ref={ref}
      type="button"
      role="combobox"
      aria-labelledby={labelId}
      aria-label={ariaLabel}
      aria-haspopup={searchable ? 'dialog' : 'listbox'}
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={searchable ? undefined : activeId}
      aria-readonly={state.readOnly || undefined}
      disabled={state.disabled}
      onClick={() => changeOpen(!open)}
      onKeyDown={onKeyDown}
      onBlur={() => {
        if (!open) onBlur?.();
      }}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-md text-start outline-none disabled:cursor-not-allowed',
        bare ? 'h-full shrink-0 px-2' : 'h-full min-h-7 flex-1 px-3',
        multiple && chips.length > 0 && 'min-w-12 px-1',
      )}
    >
      {single ? (
        <span className="flex min-w-0 items-center gap-2">
          {renderValue ? (
            renderValue(single)
          ) : (
            <>
              {single.icon && <single.icon aria-hidden className="size-4 shrink-0" />}
              <span className="truncate">{single.label}</span>
            </>
          )}
        </span>
      ) : multiple && chips.length > 0 ? (
        <span className="sr-only">{selected.map((o) => o.label).join(', ')}</span>
      ) : (
        <span className="truncate text-placeholder">{placeholder}</span>
      )}
      {bare && <ChevronDown aria-hidden className="size-4 shrink-0 text-muted" />}
    </button>
  );

  return (
    <>
      <div
        ref={setReference}
        data-control
        className={bare ? cn('flex h-full items-center', className) : frameClass(state, multiple, className)}
        {...getReferenceProps()}
      >
        {Left && <Left aria-hidden className="pointer-events-none ms-3 size-4 shrink-0 text-muted" />}
        {multiple ? (
          <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-1', chips.length > 0 && 'p-1 ps-2')}>
            {chips.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                onRemove={editable ? () => onChange(value.filter((v) => v !== o.value)) : undefined}
              />
            ))}
            {selected.length > chips.length && (
              <span className="text-sm text-muted">
                {fieldText.moreItems(selected.length - chips.length)}
              </span>
            )}
            {trigger}
          </div>
        ) : (
          trigger
        )}
        {!bare && (
          <span className="flex shrink-0 items-center pe-1.5">
            {canClear && <ClearButton onClick={() => onChange([])} />}
            {loading && <Spinner className="p-1.5" label={fieldText.loading} />}
            <ChevronDown
              aria-hidden
              onClick={() => changeOpen(!open)}
              className={cn('m-1.5 size-4 text-muted transition-transform duration-150', open && 'rotate-180')}
            />
          </span>
        )}
      </div>
      <HiddenInputs name={name} values={value} disabled={state.disabled} />

      <PopupPanel
        popup={popup}
        moveFocus={searchable}
        initialFocus={searchRef}
        className={cn('flex flex-col overflow-hidden', bare && 'w-72')}
        {...(searchable ? { role: 'dialog', 'aria-labelledby': labelId, 'aria-label': ariaLabel } : {})}
      >
        {searchable && (
          <div className="shrink-0 border-b border-line p-1">
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-label={fieldText.search}
              aria-expanded
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={activeId}
              autoComplete="off"
              spellCheck={false}
              placeholder={fieldText.search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-control w-full rounded-md bg-transparent px-2 text-base outline-none placeholder:text-placeholder md:text-sm"
            />
          </div>
        )}
        <div
          ref={setList}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-labelledby={labelId}
          aria-multiselectable={multiple || undefined}
          aria-busy={loading || undefined}
          className="min-h-0 flex-1 overflow-auto p-1"
        >
          {rows.map((row, i) => {
            const option = row.kind === 'option' ? row.option : undefined;
            const previous = rows[i - 1];
            const newGroup =
              option?.group &&
              (previous?.kind !== 'option' || previous.option.group !== option.group);
            const isSelected =
              row.kind === 'all' ? allSelected : !!option && value.includes(option.value);
            const off = isOff(row);
            const Icon = option?.icon;
            return (
              <div key={option ? `o${option.value}` : row.kind} role="presentation">
                {newGroup && (
                  <div role="presentation" className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                    {option.group}
                  </div>
                )}
                {/* eslint-disable-next-line jsx-a11y-x/click-events-have-key-events -- keys are handled by the focused box through aria-activedescendant */}
                <div
                  id={optionId(i)}
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  aria-disabled={off || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => active !== i && setActive(i)}
                  onClick={() => void pick(row)}
                  className={cn(
                    'flex min-h-control items-center gap-2 rounded-md px-2 py-1.5',
                    off ? 'cursor-not-allowed text-muted opacity-60' : 'cursor-pointer',
                    i === active && !off && 'bg-subtle',
                    isSelected && 'font-medium',
                  )}
                >
                  {row.kind === 'create' && <Plus aria-hidden className="size-4 shrink-0" />}
                  {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
                  {option?.badge && (
                    <span className="w-8 shrink-0 text-xs text-muted">{option.badge}</span>
                  )}
                  <span className="min-w-0 flex-1 break-words">
                    {row.kind === 'all' && fieldText.selectAll}
                    {row.kind === 'create' && fieldText.create(row.text)}
                    {option && (renderOption ? renderOption(option) : option.label)}
                    {option?.description && (
                      <span className="block text-xs font-normal text-muted">{option.description}</span>
                    )}
                  </span>
                  {isSelected && <Check aria-hidden className="size-4 shrink-0 text-primary" />}
                </div>
              </div>
            );
          })}
        </div>
        {loading && rows.length === 0 && (
          <div className="flex items-center gap-2 px-3 pb-3 text-muted">
            <Spinner /> {fieldText.loading}…
          </div>
        )}
        {failed && (
          <div className="flex items-center justify-between gap-2 px-3 pb-3" role="alert">
            <span className="text-danger">{fieldText.loadError}</span>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-primary hover:bg-subtle"
              onClick={() => {
                setRemote(undefined);
                setAttempt(attempt + 1);
              }}
            >
              {fieldText.retry}
            </button>
          </div>
        )}
        {!loading && !failed && rows.length === 0 && (
          <div className="px-3 pb-3 text-muted">{emptyText}</div>
        )}
        {matches.length > shown.length && (
          <div className="shrink-0 border-t border-line px-3 py-2 text-xs text-muted">
            {fieldText.narrow(maxVisible)}
          </div>
        )}
        <span className="sr-only" role="status">
          {searchable && !loading && query ? fieldText.results(matches.length) : ''}
        </span>
      </PopupPanel>
    </>
  );
}
