import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type ControlSize = 'sm' | 'md' | 'lg';

/** Props that every field accepts. */
export interface BaseFieldProps {
  id?: string | undefined;
  name?: string | undefined;
  label: ReactNode;
  /** Hides the label visually; screen readers still read it. */
  hideLabel?: boolean;
  required?: boolean;
  /** Shown after the label, e.g. "(optional)". */
  optionalText?: string;
  /** Adds an info icon beside the label. */
  info?: ReactNode;
  /** Shown at the right of the label, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  helperText?: ReactNode;
  /** One message or several. Any message puts the field in its error state. */
  error?: string | string[] | undefined;
  warning?: string | undefined;
  success?: string | undefined;
  loading?: boolean;
  disabled?: boolean | undefined;
  readOnly?: boolean;
  size?: ControlSize;
  layout?: 'vertical' | 'horizontal';
  /** Outer wrapper. */
  className?: string;
  /** The control box. */
  controlClassName?: string;
}

/** Extra parts of fields that have a text box. */
export interface AdornmentProps {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  maxLength?: number;
  showCount?: boolean;
}

/** value/onChange for fields that give a value instead of a DOM event. */
export interface ValueProps<T> {
  value?: T;
  defaultValue?: T;
  onChange?: ((value: T) => void) | undefined;
  onBlur?: (() => void) | undefined;
}

export interface Option<T extends string | number = string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
  /** Short text before the label, e.g. a country code. */
  badge?: string;
  /** Extra words that search should match. */
  keywords?: string;
  disabled?: boolean;
  group?: string;
}
