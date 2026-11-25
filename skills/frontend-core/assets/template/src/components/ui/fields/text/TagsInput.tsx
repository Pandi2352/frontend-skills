import { X } from 'lucide-react';
import { useState, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import {
  ControlFrame, FieldShell, HiddenInputs, focusRing, useField, type BaseFieldProps,
  type ValueProps,
} from '../base';

export interface ChipProps {
  label: string;
  onRemove?: (() => void) | undefined;
}

export function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-subtle px-2 py-0.5 text-sm text-foreground">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={fieldText.remove(label)}
          onClick={onRemove}
          className={cn('rounded-md p-0.5 text-muted hover:text-foreground', focusRing)}
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </span>
  );
}

export interface TagsInputProps extends BaseFieldProps, ValueProps<string[]> {
  placeholder?: string;
  maxTags?: number;
  /** Return a message to reject the tag. */
  validateTag?: (tag: string) => string | undefined;
  allowDuplicates?: boolean;
  clearable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function TagsInput(props: TagsInputProps) {
  const [problem, setProblem] = useState<string>();
  const { shell, aria, state, controlClassName, rest } = useField({
    ...props,
    error: props.error ?? problem,
  });
  const {
    value, defaultValue = [], onChange, onBlur, placeholder = fieldText.tagPlaceholder, maxTags,
    validateTag, allowDuplicates, clearable, name, ref,
  } = rest;
  const [tags, setTags] = useControllableState({ value, defaultValue, onChange });
  const [text, setText] = useState('');
  const editable = !state.disabled && !state.readOnly;

  /** Adds the valid tags and keeps the first rejected one in the box. */
  const add = (input: string) => {
    const next = [...tags];
    let rejected = '';
    let message: string | undefined;
    for (const tag of input.split(/[,\n\t;]/).map((t) => t.trim()).filter(Boolean)) {
      const duplicate =
        !allowDuplicates && next.some((t) => t.toLowerCase() === tag.toLowerCase());
      const reason =
        (duplicate && fieldText.duplicateTag(tag)) ||
        (maxTags !== undefined && next.length >= maxTags && fieldText.maxItems(maxTags)) ||
        validateTag?.(tag);
      if (reason) {
        message ??= reason;
        rejected ||= tag;
      } else next.push(tag);
    }
    setProblem(message);
    setText(rejected);
    if (next.length !== tags.length) setTags(next);
  };

  return (
    <FieldShell
      shell={shell}
      count={maxTags === undefined ? undefined : { current: tags.length, max: maxTags }}
    >
      <ControlFrame
        grow
        state={state}
        className={controlClassName}
        onClear={clearable && tags.length ? () => setTags([]) : undefined}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 p-1 ps-2">
          {tags.map((tag, i) => (
            <Chip
              key={`${tag}-${i}`}
              label={tag}
              onRemove={editable ? () => setTags(tags.filter((_, n) => n !== i)) : undefined}
            />
          ))}
          <input
            {...aria}
            ref={ref}
            type="text"
            value={text}
            autoComplete="off"
            placeholder={tags.length ? '' : placeholder}
            disabled={state.disabled}
            readOnly={state.readOnly}
            onChange={(event) => {
              const next = event.target.value;
              if (/[,;]/.test(next)) add(next);
              else {
                setText(next);
                setProblem(undefined);
              }
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text');
              if (!/[,\n\t;]/.test(pasted)) return;
              event.preventDefault();
              add(text + pasted);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'Enter' && text.trim()) {
                event.preventDefault();
                add(text);
              } else if (event.key === 'Backspace' && !text && tags.length && editable) {
                setTags(tags.slice(0, -1));
              }
            }}
            onBlur={() => {
              if (text.trim()) add(text);
              onBlur?.();
            }}
            className="h-7 min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
          />
        </div>
      </ControlFrame>
      <HiddenInputs name={name} values={tags} disabled={state.disabled} />
    </FieldShell>
  );
}
