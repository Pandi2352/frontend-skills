import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useMergedRefs } from '@/hooks/useMergedRefs';
import { setNativeValue } from '@/utils/dom';
import {
  ControlFrame, FieldShell, innerInputClass, useField, type AdornmentProps, type BaseFieldProps,
} from '../base';
import { cn } from '@/lib/cn';

export interface InputProps
  extends BaseFieldProps,
    AdornmentProps,
    Omit<
      ComponentProps<'input'>,
      keyof BaseFieldProps | keyof AdornmentProps | 'type' | 'value' | 'defaultValue'
    > {
  type?: 'text' | 'email' | 'tel' | 'url' | 'password' | 'search';
  value?: string | number | null;
  defaultValue?: string | number;
  /** Button at the far right of the box. */
  action?: ReactNode;
  /** Content between the box and its messages. */
  footer?: ReactNode;
}

const autoCompleteFor: Partial<Record<string, string>> = { email: 'email', tel: 'tel', url: 'url' };

export function Input(props: InputProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const {
    leftIcon, rightIcon, prefix, suffix, clearable, onClear, maxLength, showCount,
    action, footer, type = 'text', value, defaultValue, onChange, ref, ...input
  } = rest;

  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(inputRef, ref);
  const [inner, setInner] = useState(String(defaultValue ?? ''));
  const text = value === undefined ? inner : String(value ?? '');

  const clear = () => {
    const element = inputRef.current;
    if (!element) return;
    setNativeValue(element, '');
    element.focus();
    onClear?.();
  };

  return (
    <FieldShell
      shell={shell}
      footer={footer}
      count={showCount ? { current: text.length, max: maxLength } : undefined}
    >
      <ControlFrame
        state={state}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        prefix={prefix}
        suffix={suffix}
        action={action}
        success={!!shell.success && !state.invalid}
        onClear={clearable && text ? clear : undefined}
        className={controlClassName}
      >
        <input
          autoComplete={autoCompleteFor[type]}
          spellCheck={type === 'text' ? undefined : false}
          {...input}
          {...aria}
          ref={mergedRef}
          type={type}
          maxLength={maxLength}
          disabled={state.disabled}
          readOnly={state.readOnly}
          {...(value === undefined ? { defaultValue } : { value: text })}
          onChange={(event) => {
            setInner(event.target.value);
            onChange?.(event);
          }}
          className={cn(innerInputClass, leftIcon && 'ps-2')}
        />
      </ControlFrame>
    </FieldShell>
  );
}
