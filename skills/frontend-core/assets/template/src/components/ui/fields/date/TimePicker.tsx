import { Clock } from 'lucide-react';
import { useMemo, type Ref } from 'react';
import { appConfig } from '@/config/app.config';
import { useControllableState } from '@/hooks/useControllableState';
import { FieldShell, useField, type BaseFieldProps, type Option, type ValueProps } from '../base';
import { SelectControl } from '../select/SelectControl';

export interface TimeOptions {
  /** "HH:mm", 24-hour */
  minTime?: string;
  maxTime?: string;
  stepMinutes?: number;
  hour12?: boolean;
  locale?: string;
}

export function useTimeOptions(options: TimeOptions): Option[] {
  const { minTime = '00:00', maxTime = '23:59', stepMinutes = 15, hour12, locale = appConfig.locale } = options;
  return useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, {
      hour: 'numeric', minute: '2-digit', timeZone: 'UTC', ...(hour12 === undefined ? {} : { hour12 }),
    });
    const list: Option[] = [];
    for (let m = 0; m < 1440; m += Math.max(1, stepMinutes)) {
      const value = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      if (value < minTime || value > maxTime) continue;
      const plain = value.replace(':', '');
      list.push({
        value,
        label: format.format(new Date(m * 60_000)),
        keywords: `${value} ${plain} ${plain.replace(/^0/, '')}`,
      });
    }
    return list;
  }, [minTime, maxTime, stepMinutes, hour12, locale]);
}

export interface TimePickerProps extends BaseFieldProps, TimeOptions, ValueProps<string | null> {
  clearable?: boolean;
  placeholder?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** Value: "14:30" or null. */
export function TimePicker(props: TimePickerProps) {
  const { shell, aria, state, labelId, controlClassName, rest } = useField(props);
  const { value, defaultValue, onChange, onBlur, name, ref, clearable, placeholder, ...time } = rest;
  const options = useTimeOptions(time);
  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  return (
    <FieldShell shell={shell}>
      <SelectControl
        searchable
        leftIcon={Clock}
        maxVisible={1440}
        aria={aria}
        state={state}
        labelId={labelId}
        className={controlClassName}
        name={name}
        ref={ref}
        onBlur={onBlur}
        options={options}
        {...(placeholder ? { placeholder } : {})}
        {...(clearable ? { clearable } : {})}
        value={current ? [current] : []}
        onChange={(next) => setCurrent(next[0] ?? null)}
      />
    </FieldShell>
  );
}
