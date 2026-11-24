import { CalendarRange } from 'lucide-react';
import { useState, type Ref } from 'react';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { formatIso, type IsoDate } from '@/utils/date';
import {
  FieldShell, HiddenInputs, PopupPanel, useField, usePopup, type BaseFieldProps, type ValueProps,
} from '../base';
import { Calendar, type DateLimits } from './Calendar';
import { PickerTrigger } from './PickerTrigger';

export interface DateRange {
  start: IsoDate | null;
  end: IsoDate | null;
}

export interface DateRangePickerProps extends BaseFieldProps, DateLimits, ValueProps<DateRange> {
  clearable?: boolean;
  placeholder?: string;
  presets?: { label: string; range: DateRange }[];
  ref?: Ref<HTMLButtonElement>;
}

const empty: DateRange = { start: null, end: null };

export function DateRangePicker(props: DateRangePickerProps) {
  const { shell, aria, state, labelId, controlClassName, rest } = useField(props);
  const {
    value, defaultValue, onChange, onBlur, name, ref, clearable, presets,
    placeholder = fieldText.chooseRange, ...limits
  } = rest;
  const locale = limits.locale ?? appConfig.locale;
  const [current, setCurrent] = useControllableState<DateRange>({
    value,
    defaultValue: defaultValue ?? empty,
    onChange,
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(current);
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) setDraft(current);
  };
  const popup = usePopup({ open, onOpenChange: changeOpen, maxHeight: 520 });
  const apply = (range: DateRange) => {
    setCurrent(range);
    setOpen(false);
  };
  const show = (d: IsoDate) => formatIso(d, locale, { dateStyle: 'medium' });

  return (
    <FieldShell shell={shell}>
      <PickerTrigger
        aria={aria}
        state={state}
        labelId={labelId}
        popup={popup}
        triggerRef={ref}
        icon={CalendarRange}
        className={controlClassName}
        placeholder={placeholder}
        text={current.start && current.end ? `${show(current.start)} – ${show(current.end)}` : ''}
        onToggle={() => changeOpen(!open)}
        onBlur={onBlur}
        onClear={clearable ? () => setCurrent(empty) : undefined}
      />
      <HiddenInputs name={name && `${name}.start`} values={current.start ? [current.start] : []} disabled={state.disabled} />
      <HiddenInputs name={name && `${name}.end`} values={current.end ? [current.end] : []} disabled={state.disabled} />
      <PopupPanel popup={popup} initialFocus={-1} role="dialog" aria-label={fieldText.chooseRange}>
        <div className="flex flex-col md:flex-row">
          {presets && (
            <div className="flex flex-wrap gap-1 border-b border-line p-2 md:flex-col md:border-r md:border-b-0">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => apply(p.range)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}
          <Calendar
            {...limits}
            months={2}
            selected={null}
            range={draft}
            onSelect={(date) =>
              setDraft(
                !draft.start || draft.end
                  ? { start: date, end: null }
                  : date < draft.start
                    ? { start: date, end: draft.start }
                    : { start: draft.start, end: date },
              )
            }
          />
        </div>
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-line bg-surface p-2">
          <span className="text-xs text-muted" role="status">
            {draft.start && show(draft.start)}
            {draft.end && ` – ${show(draft.end)}`}
          </span>
          <Button size="sm" disabled={!draft.start || !draft.end} onClick={() => apply(draft)}>
            {fieldText.apply}
          </Button>
        </div>
      </PopupPanel>
    </FieldShell>
  );
}
