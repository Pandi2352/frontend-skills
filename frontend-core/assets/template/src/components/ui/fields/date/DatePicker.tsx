import { CalendarDays } from 'lucide-react';
import { useState, type Ref } from 'react';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { formatTyped, isValidIso, parseTyped, todayIso, typedPlaceholder, type IsoDate } from '@/utils/date';
import {
  ControlFrame, FieldShell, HiddenInputs, PopupPanel, frameButtonClass, innerInputClass, useField,
  usePopup, type BaseFieldProps, type FieldAria, type FieldState, type ValueProps,
} from '../base';
import { Calendar, isAllowed, type DateLimits } from './Calendar';

interface DateControlProps extends DateLimits {
  aria: FieldAria;
  state: FieldState;
  value: IsoDate | null;
  onChange: (value: IsoDate | null) => void;
  onBlur?: (() => void) | undefined;
  /** Message about text that is not an allowed date. */
  onProblem: (message: string | undefined) => void;
  clearable?: boolean | undefined;
  name?: string | undefined;
  ariaLabel?: string;
  className?: string | undefined;
  ref?: Ref<HTMLInputElement> | undefined;
}

/** Typing and calendar, without label or messages. */
export function DateControl(props: DateControlProps) {
  const {
    aria, state, value, onChange, onBlur, onProblem, clearable, name, ariaLabel, className, ref,
    ...limits
  } = props;
  const locale = limits.locale ?? appConfig.locale;
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popup = usePopup({ open, onOpenChange: setOpen, maxHeight: 420 });
  const { setReference } = popup;
  const editable = !state.disabled && !state.readOnly;

  const accept = (next: IsoDate | null) => {
    setDraft(null);
    onProblem(undefined);
    onChange(next);
  };
  const commit = () => {
    if (draft === null) return;
    if (!draft.trim()) return accept(null);
    const date = parseTyped(draft, locale);
    if (date && isAllowed(date, limits)) return accept(date);
    // Keep the text so it can be corrected, but never keep a wrong date.
    onProblem(
      date ? fieldText.dateNotAllowed : fieldText.invalidDate(formatTyped(todayIso(), locale)),
    );
    if (value !== null) onChange(null);
  };

  return (
    <>
      <ControlFrame
        ref={setReference}
        state={state}
        className={className}
        onClear={clearable && (value || draft) ? () => accept(null) : undefined}
        action={
          <button
            type="button"
            aria-label={fieldText.openCalendar}
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={!editable}
            onClick={() => setOpen(!open)}
            className={frameButtonClass}
          >
            <CalendarDays aria-hidden className="size-4" />
          </button>
        }
      >
        <input
          {...aria}
          ref={ref}
          type="text"
          aria-label={ariaLabel}
          inputMode="numeric"
          autoComplete="off"
          placeholder={typedPlaceholder(locale)}
          disabled={state.disabled}
          readOnly={state.readOnly}
          value={draft ?? (isValidIso(value) ? formatTyped(value, locale) : '')}
          onChange={(event) => {
            setDraft(event.target.value);
            onProblem(undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'ArrowDown' && editable) {
              event.preventDefault();
              commit();
              setOpen(true);
            }
          }}
          onBlur={() => {
            commit();
            onBlur?.();
          }}
          className={innerInputClass}
        />
      </ControlFrame>
      <HiddenInputs name={name} values={value ? [value] : []} disabled={state.disabled} />
      <PopupPanel popup={popup} initialFocus={-1} role="dialog" aria-label={fieldText.chooseDate}>
        <Calendar
          {...limits}
          selected={isValidIso(value) ? value : null}
          onSelect={(date) => {
            accept(date);
            setOpen(false);
          }}
        />
      </PopupPanel>
    </>
  );
}

export interface DatePickerProps extends BaseFieldProps, DateLimits, ValueProps<IsoDate | null> {
  clearable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Value: "2026-12-31" or null. */
export function DatePicker(props: DatePickerProps) {
  const [problem, setProblem] = useState<string>();
  const { shell, aria, state, controlClassName, rest } = useField({
    ...props,
    error: problem ?? props.error,
  });
  const { value, defaultValue, onChange, ...date } = rest;
  const [current, setCurrent] = useControllableState<IsoDate | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  return (
    <FieldShell shell={shell}>
      <DateControl
        {...date}
        aria={aria}
        state={state}
        className={controlClassName}
        value={current}
        onChange={setCurrent}
        onProblem={setProblem}
      />
    </FieldShell>
  );
}
