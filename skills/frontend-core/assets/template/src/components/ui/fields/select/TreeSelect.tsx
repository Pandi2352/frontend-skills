import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import {
  ClearButton, FieldShell, HiddenInputs, PopupPanel, frameClass, useField, usePopup,
  type BaseFieldProps, type ValueProps,
} from '../base';
import { CheckboxBox } from '../choice/Checkbox';
import { Chip } from '../text/TagsInput';

export interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeSelectProps extends BaseFieldProps, ValueProps<string[]> {
  nodes: TreeNode[];
  placeholder?: string;
  clearable?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const leaves = (node: TreeNode): string[] =>
  node.children?.length ? node.children.flatMap(leaves) : node.disabled ? [] : [node.value];
const flatten = (nodes: TreeNode[]): TreeNode[] =>
  nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
const hasText = (node: TreeNode, text: string): boolean =>
  node.label.toLowerCase().includes(text) || !!node.children?.some((c) => hasText(c, text));

/** Multi-select tree. The value holds leaf values; parents show partial state. */
export function TreeSelect(props: TreeSelectProps) {
  const { shell, aria, state, labelId, controlClassName, rest } = useField(props);
  const { nodes, placeholder = fieldText.select, clearable, name, onBlur, ref } = rest;
  const [values, setValues] = useControllableState<string[]>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? [],
    onChange: rest.onChange,
  });
  const treeId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const editable = !state.disabled && !state.readOnly;
  const text = query.trim().toLowerCase();

  const changeOpen = (next: boolean) => {
    if (next && !editable) return;
    setOpen(next);
    if (!next) setQuery('');
  };
  const popup = usePopup({ open, onOpenChange: changeOpen, matchWidth: true });
  const { setReference, getReferenceProps } = popup;

  const visible: { node: TreeNode; level: number; isOpen: boolean }[] = [];
  const walk = (list: TreeNode[], level: number) => {
    for (const node of list) {
      if (text && !hasText(node, text)) continue;
      const isOpen = !!node.children?.length && (!!text || expanded.includes(node.value));
      visible.push({ node, level, isOpen });
      if (isOpen) walk(node.children ?? [], level + 1);
    }
  };
  walk(nodes, 1);

  const checkState = (node: TreeNode) => {
    const all = leaves(node);
    const on = all.filter((v) => values.includes(v)).length;
    return { checked: all.length > 0 && on === all.length, partial: on > 0 && on < all.length };
  };
  const toggle = (node: TreeNode) => {
    if (node.disabled) return;
    const all = leaves(node);
    setValues(
      checkState(node).checked
        ? values.filter((v) => !all.includes(v))
        : [...new Set([...values, ...all])],
    );
  };
  const expand = (node: TreeNode, on: boolean) =>
    setExpanded(on ? [...expanded, node.value] : expanded.filter((v) => v !== node.value));

  const onKeyDown = (event: KeyboardEvent) => {
    const item = visible[active];
    const actions: Record<string, () => void> = {
      ArrowDown: () => setActive(Math.min(active + 1, visible.length - 1)),
      ArrowUp: () => setActive(Math.max(active - 1, 0)),
      Enter: () => item && toggle(item.node),
      ...(!query && item?.node.children
        ? {
            ArrowRight: () => !item.isOpen && expand(item.node, true),
            ArrowLeft: () => item.isOpen && expand(item.node, false),
          }
        : {}),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const labels = flatten(nodes).filter((n) => !n.children?.length && values.includes(n.value));

  return (
    <FieldShell shell={shell}>
      <div
        ref={setReference}
        data-control
        className={frameClass(state, true, controlClassName)}
        {...getReferenceProps()}
      >
        <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-1', labels.length > 0 && 'p-1 ps-2')}>
          {labels.map((n) => (
            <Chip
              key={n.value}
              label={n.label}
              onRemove={editable ? () => setValues(values.filter((v) => v !== n.value)) : undefined}
            />
          ))}
          <button
            {...aria}
            ref={ref}
            type="button"
            role="combobox"
            aria-labelledby={labelId}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? treeId : undefined}
            disabled={state.disabled}
            onClick={() => changeOpen(!open)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                changeOpen(true);
              }
            }}
            onBlur={() => {
              if (!open) onBlur?.();
            }}
            className="min-h-7 min-w-12 flex-1 px-3 text-start outline-none"
          >
            {labels.length ? (
              <span className="sr-only">{labels.map((n) => n.label).join(', ')}</span>
            ) : (
              <span className="text-placeholder">{placeholder}</span>
            )}
          </button>
        </div>
        {clearable && editable && values.length > 0 && <ClearButton onClick={() => setValues([])} />}
        <ChevronDown aria-hidden className="mx-3 size-4 shrink-0 text-muted" />
      </div>
      <HiddenInputs name={name} values={values} disabled={state.disabled} />

      <PopupPanel
        popup={popup}
        initialFocus={searchRef}
        role="dialog"
        aria-labelledby={labelId}
        className="flex flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-line p-1">
          <input
            ref={searchRef}
            type="text"
            role="combobox"
            aria-label={fieldText.search}
            aria-expanded
            aria-haspopup="tree"
            aria-controls={treeId}
            aria-activedescendant={visible[active] ? `${treeId}-${active}` : undefined}
            autoComplete="off"
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
        <div
          id={treeId}
          role="tree"
          tabIndex={-1}
          aria-multiselectable
          aria-labelledby={labelId}
          className="min-h-0 flex-1 overflow-auto p-1"
        >
          {visible.map(({ node, level, isOpen }, i) => {
            const { checked, partial } = checkState(node);
            return (
              // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events -- keys are handled by the search box through aria-activedescendant
              <div
                key={node.value}
                id={`${treeId}-${i}`}
                role="treeitem"
                tabIndex={-1}
                aria-level={level}
                aria-selected={checked}
                aria-checked={partial ? 'mixed' : checked}
                aria-expanded={node.children?.length ? isOpen : undefined}
                aria-disabled={node.disabled || undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setActive(i);
                  toggle(node);
                }}
                className={cn(
                  'flex min-h-control cursor-pointer items-center gap-2 rounded-md pe-2',
                  i === active && 'bg-subtle',
                  node.disabled && 'cursor-not-allowed opacity-60',
                )}
                style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.25}rem` }}
              >
                <span
                  aria-hidden
                  className="flex size-6 items-center justify-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (node.children?.length) expand(node, !isOpen);
                  }}
                >
                  {!!node.children?.length &&
                    (isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />)}
                </span>
                <span inert className="pointer-events-none inline-flex">
                  <CheckboxBox
                    aria-label={node.label}
                    checked={checked}
                    indeterminate={partial}
                    onChange={() => toggle(node)}
                  />
                </span>
                <span className="min-w-0 truncate">{node.label}</span>
              </div>
            );
          })}
          {visible.length === 0 && <div className="p-2 text-muted">{fieldText.noResults}</div>}
        </div>
      </PopupPanel>
    </FieldShell>
  );
}
