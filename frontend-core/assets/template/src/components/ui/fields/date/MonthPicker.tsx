import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, type Ref } from 'react';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { formatIso, toIso, todayIso } from '@/utils/date';
import {
  FieldShell, HiddenInputs, PopupPanel, focusRing, frameButtonClass, useField, usePopup,
  type BaseFieldProps, type ValueProps,
} from '../base';
import { Dropdown, type DropdownProps } from '../select/Dropdown';
import { PickerTrigger } from './PickerTrigger';

export interface MonthPickerProps extends BaseFieldProps, ValueProps<string | null> {
  /** "YYYY-MM" */
  min?: string;
  max?: string;
  locale?: string;
  clearable?: boolean;
  placeholder?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** Value: "2026-12" or null. */
export function MonthPicker(props: MonthPickerProps) {
  const { shell, aria, state, labelId, controlClassName, rest } = useField(props);
  const {
    min, max, locale = appConfig.locale, clearable, placeholder = fieldText.chooseMonth, name,
    onBlur, ref,
  } = rest;
  const [value, setValue] = useControllableState<string | null>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? null,
    onChange: rest.onChange,
  });
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => Number((value ?? todayIso()).slice(0, 4)));
  const popup = usePopup({ open, onOpenChange: setOpen });

  return (
    <FieldShell shell={shell}>
      <PickerTrigger
        aria={aria}
        state={state}
        labelId={labelId}
        popup={popup}
        triggerRef={ref}
        icon={CalendarDays}
        className={controlClassName}
        placeholder={placeholder}
        text={value ? formatIso(`${value}-01`, locale, { month: 'long', year: 'numeric' }) : ''}
        onToggle={() => setOpen(!open)}
        onBlur={onBlur}
        onClear={clearable ? () => setValue(null) : undefined}
      />
      <HiddenInputs name={name} values={value ? [value] : []} disabled={state.disabled} />
      <PopupPanel popup={popup} role="dialog" aria-label={fieldText.chooseMonth} className="w-72 p-3">
        <div className="flex items-center justify-between pb-2">
          <button
            type="button"
            aria-label={fieldText.previous}
            disabled={!!min && year <= Number(min.slice(0, 4))}
            onClick={() => setYear(year - 1)}
            className={frameButtonClass}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <span aria-live="polite" className="font-medium">
            {year}
          </span>
          <button
            type="button"
            aria-label={fieldText.next}
            disabled={!!max && year >= Number(max.slice(0, 4))}
            onClick={() => setYear(year + 1)}
            className={frameButtonClass}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => {
            const first = toIso(year, i + 1, 1);
            const month = first.slice(0, 7);
            return (
              <button
                key={month}
                type="button"
                aria-pressed={month === value}
                aria-label={formatIso(first, locale, { month: 'long', year: 'numeric' })}
                disabled={(!!min && month < min) || (!!max && month > max)}
                onClick={() => {
                  setValue(month);
                  setOpen(false);
                }}
                className={cn(
                  'h-control rounded-md disabled:cursor-not-allowed disabled:opacity-50',
                  focusRing,
                  month === value ? 'bg-primary text-on-primary' : 'hover:bg-subtle',
                )}
              >
                {formatIso(first, locale, { month: 'short' })}
              </button>
            );
          })}
        </div>
      </PopupPanel>
    </FieldShell>
  );
}

export interface YearPickerProps extends Omit<DropdownProps<number>, 'options'> {
  minYear?: number;
  maxYear?: number;
  order?: 'asc' | 'desc';
}

/** Value: 2026 or null. */
export function YearPicker(props: YearPickerProps) {
  const thisYear = Number(todayIso().slice(0, 4));
  const { minYear = thisYear - 100, maxYear = thisYear + 10, order = 'desc', ...rest } = props;
  const options = useMemo(() => {
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
    if (order === 'desc') years.reverse();
    return years.map((y) => ({ value: y, label: String(y) }));
  }, [minYear, maxYear, order]);
  return <Dropdown searchable {...rest} options={options} />;
}
