import { useId } from 'react';
import type { BaseFieldProps } from './field.types';

const toList = (error: BaseFieldProps['error']) =>
  (Array.isArray(error) ? error : [error]).filter((e): e is string => !!e);

/**
 * Splits field props into: shell (label and messages), aria (for the control),
 * state (for styling), and rest (the field's own props).
 */
export function useField<P extends BaseFieldProps>(props: P) {
  const {
    id, label, hideLabel, required, optionalText, info, labelAction, helperText,
    error, warning, success, loading, disabled, readOnly, size, layout,
    className, controlClassName, ...rest
  } = props;

  const autoId = useId();
  const controlId = id ?? autoId;
  const errors = toList(error);
  const invalid = errors.length > 0;
  const ids = {
    control: controlId,
    label: `${controlId}-label`,
    message: `${controlId}-message`,
    helper: `${controlId}-helper`,
  };
  const hasMessage = invalid || !!warning || !!success;
  const describedBy =
    [hasMessage && ids.message, helperText && ids.helper].filter(Boolean).join(' ') || undefined;

  return {
    shell: {
      ids, label, hideLabel, required, optionalText, info, labelAction,
      helperText, errors, warning, success, layout, className, disabled, describedBy,
    },
    aria: {
      id: controlId,
      'aria-describedby': describedBy,
      'aria-invalid': invalid || undefined,
      'aria-required': required || undefined,
    },
    state: {
      size: size ?? ('md' as const),
      invalid,
      disabled: !!disabled,
      readOnly: !!readOnly,
      loading: !!loading,
    },
    labelId: ids.label,
    controlClassName,
    rest,
  };
}

export type ShellProps = ReturnType<typeof useField<BaseFieldProps>>['shell'];
export type FieldAria = ReturnType<typeof useField<BaseFieldProps>>['aria'];
export type FieldState = ReturnType<typeof useField<BaseFieldProps>>['state'];
