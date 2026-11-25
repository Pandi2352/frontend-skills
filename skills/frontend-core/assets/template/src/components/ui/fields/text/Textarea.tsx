import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { useMergedRefs } from '@/hooks/useMergedRefs';
import { cn } from '@/lib/cn';
import { FieldShell, frameClass, useField, type BaseFieldProps } from '../base';

export interface TextareaProps
  extends BaseFieldProps,
    Omit<ComponentProps<'textarea'>, keyof BaseFieldProps | 'value' | 'defaultValue'> {
  value?: string | null;
  defaultValue?: string;
  /** Grows with its content between `rows` and `maxRows`. */
  autoResize?: boolean;
  maxRows?: number;
  showCount?: boolean;
  resize?: 'none' | 'vertical';
}

export function Textarea(props: TextareaProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const {
    value, defaultValue, onChange, rows = 4, maxRows = 12, autoResize, showCount,
    maxLength, resize = 'vertical', ref, ...textarea
  } = rest;

  const boxRef = useRef<HTMLTextAreaElement>(null);
  const mergedRef = useMergedRefs(boxRef, ref);
  const [inner, setInner] = useState(defaultValue ?? '');
  const text = value === undefined ? inner : (value ?? '');

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || !autoResize) return;
    box.style.height = 'auto';
    const line = parseFloat(getComputedStyle(box).lineHeight) || 20;
    box.style.height = `${Math.min(box.scrollHeight + 2, line * maxRows + 18)}px`;
  }, [text, autoResize, maxRows]);

  return (
    <FieldShell
      shell={shell}
      count={showCount ? { current: text.length, max: maxLength } : undefined}
    >
      <textarea
        {...textarea}
        {...aria}
        ref={mergedRef}
        rows={rows}
        maxLength={maxLength}
        disabled={state.disabled}
        readOnly={state.readOnly}
        {...(value === undefined ? { defaultValue } : { value: text })}
        onChange={(event) => {
          setInner(event.target.value);
          onChange?.(event);
        }}
        className={cn(
          frameClass(state, true),
          'block px-3 py-2 outline-none placeholder:text-placeholder',
          autoResize || resize === 'none' ? 'resize-none' : 'resize-y',
          controlClassName,
        )}
      />
    </FieldShell>
  );
}
