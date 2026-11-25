import { Clock } from 'lucide-react';
import { useState, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import type { IsoDate } from '@/utils/date';
import { FieldShell, HiddenInputs, useField, type BaseFieldProps, type ValueProps } from '../base';
import { SelectControl } from '../select/SelectControl';
import type { DateLimits } from './Calendar';
import { DateControl } from './DatePicker';
import { useTimeOptions, type TimeOptions } from './TimePicker';

export interface DateTimePickerProps
  extends BaseFieldProps,
    DateLimits,
    Omit<TimeOptions, 'locale'>,
    ValueProps<string | null> {
  clearable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Value: local "2026-12-31T14:30", or null until both parts are chosen.
 * It has no timezone; convert it when sending to the server.
 */
export function DateTimePicker(props: DateTimePickerProps) {
  const [problem, setProblem] = useState<string>();
  const { shell, aria, state, controlClassName, rest } = useField({
    ...props,
    error: problem ?? props.error,
  });
  const {
    value, defaultValue, onChange, onBlur, name, ref, clearable,
    minTime, maxTime, stepMinutes, hour12, ...limits
  } = rest;
  const [current, setCurrent] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  // Holds the part chosen first, until the other one is chosen too.
  const [pending, setPending] = useState<{ date: IsoDate | null; time: string | null }>({
    date: null,
    time: null,
  });
  const date = current?.slice(0, 10) ?? pending.date;
  const time = current?.slice(11, 16) ?? pending.time;
  const options = useTimeOptions({
    ...(minTime ? { minTime } : {}),
    ...(maxTime ? { maxTime } : {}),
    ...(stepMinutes ? { stepMinutes } : {}),
    ...(hour12 === undefined ? {} : { hour12 }),
    ...(limits.locale ? { locale: limits.locale } : {}),
  });

  const update = (nextDate: IsoDate | null, nextTime: string | null) => {
    setPending({ date: nextDate, time: nextTime });
    const next = nextDate && nextTime ? `${nextDate}T${nextTime}` : null;
    if (next !== current) setCurrent(next);
  };
  const shared = { state, onBlur };

  return (
    <FieldShell shell={shell} group="group">
      <div className="grid gap-2 sm:grid-cols-[3fr_2fr]">
        <DateControl
          {...limits}
          {...shared}
          ref={ref}
          aria={{ ...aria, id: `${aria.id}-date` }}
          ariaLabel={fieldText.date}
          clearable={clearable}
          className={controlClassName}
          value={date}
          onChange={(next) => update(next, time)}
          onProblem={setProblem}
        />
        <SelectControl
          {...shared}
          searchable
          leftIcon={Clock}
          maxVisible={1440}
          aria={{ ...aria, id: `${aria.id}-time` }}
          ariaLabel={fieldText.time}
          placeholder={fieldText.time}
          className={controlClassName}
          options={options}
          value={time ? [time] : []}
          onChange={(next) => update(date, next[0] ?? null)}
        />
      </div>
      <HiddenInputs name={name} values={current ? [current] : []} disabled={state.disabled} />
    </FieldShell>
  );
}
