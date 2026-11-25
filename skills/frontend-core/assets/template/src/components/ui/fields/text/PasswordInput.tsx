import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { fieldText } from '@/constants/field-text';
import { cn } from '@/lib/cn';
import { frameButtonClass } from '../base';
import { Input, type InputProps } from './Input';

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const defaultPasswordRules: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'A symbol', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'action' | 'footer'> {
  /** Shows the strength bar. Use when a password is being created. */
  showStrength?: boolean;
  /** Shows a live checklist. */
  rules?: PasswordRule[];
}

const tones = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];

export function PasswordInput(props: PasswordInputProps) {
  const { showStrength, rules, value, onChange, onKeyUp, onBlur, ...rest } = props;
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [inner, setInner] = useState(String(rest.defaultValue ?? ''));
  const password = value === undefined ? inner : String(value ?? '');
  const score = defaultPasswordRules.filter((r) => r.test(password)).length;

  return (
    <Input
      autoComplete={showStrength || rules ? 'new-password' : 'current-password'}
      autoCapitalize="none"
      {...rest}
      {...(value === undefined ? {} : { value })}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      onChange={(event) => {
        setInner(event.target.value);
        onChange?.(event);
      }}
      onKeyUp={(event: KeyboardEvent<HTMLInputElement>) => {
        setCapsLock(event.getModifierState('CapsLock'));
        onKeyUp?.(event);
      }}
      onBlur={(event) => {
        setCapsLock(false);
        onBlur?.(event);
      }}
      warning={capsLock ? fieldText.capsLock : rest.warning}
      action={
        <button
          type="button"
          disabled={rest.disabled}
          aria-label={visible ? fieldText.hidePassword : fieldText.showPassword}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className={frameButtonClass}
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      }
      footer={
        (showStrength || rules) && (
          <div className="flex flex-col gap-1.5 text-xs text-muted">
            {showStrength && password && (
              <div className="flex items-center gap-2">
                <div aria-hidden className="grid flex-1 grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className={cn('h-1 rounded-md', n <= score ? tones[score] : 'bg-line')}
                    />
                  ))}
                </div>
                <span role="status">{fieldText.strength[score]}</span>
              </div>
            )}
            {rules && (
              <ul className="flex flex-col gap-0.5">
                {rules.map((rule) => {
                  const ok = rule.test(password);
                  const Icon = ok ? Check : X;
                  return (
                    <li key={rule.label} className={cn('flex items-center gap-1', ok && 'text-success')}>
                      <Icon aria-hidden className="size-3.5" />
                      <span className="sr-only">{ok ? '✓' : '✗'}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )
      }
    />
  );
}
