import type { Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { FieldShell, focusRing, minHeightClass, useField, type BaseFieldProps, type ValueProps } from '../base';

interface SliderOptions {
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  marks?: number[];
}

export interface SliderProps extends BaseFieldProps, SliderOptions, ValueProps<number> {
  ref?: Ref<HTMLInputElement>;
}

function Marks({ marks, format }: { marks: number[] | undefined; format: (n: number) => string }) {
  if (!marks) return null;
  return (
    <div aria-hidden className="flex justify-between text-xs text-muted">
      {marks.map((m) => (
        <span key={m}>{format(m)}</span>
      ))}
    </div>
  );
}

const thumb =
  'pointer-events-none absolute inset-x-0 w-full appearance-none bg-transparent accent-primary ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary';

/** Line behind the thumbs. */
function Track({ from, to }: { from: number; to: number }) {
  return (
    <>
      <span aria-hidden className="absolute inset-x-0 h-1 rounded-md bg-line" />
      <span
        aria-hidden
        className="absolute h-1 rounded-md bg-primary"
        style={{ left: `${from}%`, right: `${100 - to}%` }}
      />
    </>
  );
}

const toPercent = (n: number, min: number, max: number) => ((n - min) / (max - min || 1)) * 100;

export function Slider(props: SliderProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const { min = 0, max = 100, step = 1, formatValue = String, marks, name, ref } = rest;
  const [value, setValue] = useControllableState({
    value: rest.value,
    defaultValue: rest.defaultValue ?? min,
    onChange: rest.onChange,
  });
  return (
    <FieldShell shell={shell}>
      <div className={cn('flex items-center gap-3', minHeightClass[state.size], controlClassName)}>
        <div className="relative flex h-5 min-w-0 flex-1 items-center">
          <Track from={0} to={toPercent(value, min, max)} />
          <input
            {...aria}
            aria-required={undefined}
            ref={ref}
            type="range"
            name={name}
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={state.disabled || state.readOnly}
            aria-valuetext={formatValue(value)}
            onChange={(event) => setValue(event.target.valueAsNumber)}
            onBlur={rest.onBlur}
            className={cn(thumb, focusRing)}
          />
        </div>
        <output className="min-w-10 text-end text-sm tabular-nums">{formatValue(value)}</output>
      </div>
      <Marks marks={marks} format={formatValue} />
    </FieldShell>
  );
}

export interface RangeSliderProps
  extends BaseFieldProps,
    SliderOptions,
    ValueProps<[number, number]> {
  ref?: Ref<HTMLInputElement>;
}

export function RangeSlider(props: RangeSliderProps) {
  const { shell, state, controlClassName, rest } = useField(props);
  const { min = 0, max = 100, step = 1, formatValue = String, marks, name, ref } = rest;
  const [[low, high], setValue] = useControllableState<[number, number]>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? [min, max],
    onChange: rest.onChange,
  });
  const shared = {
    min,
    max,
    step,
    disabled: state.disabled || state.readOnly,
    onBlur: rest.onBlur,
    className: cn(thumb, focusRing),
  };
  return (
    <FieldShell shell={shell} group="group">
      <div className={cn('flex items-center gap-3', minHeightClass[state.size], controlClassName)}>
        <div className="relative flex h-5 min-w-0 flex-1 items-center">
          <Track from={toPercent(low, min, max)} to={toPercent(high, min, max)} />
          <input
            {...shared}
            type="range"
            ref={ref}
            name={name && `${name}.min`}
            aria-label={fieldText.minimum}
            aria-valuetext={formatValue(low)}
            value={low}
            onChange={(e) => setValue([Math.min(e.target.valueAsNumber, high), high])}
          />
          <input
            {...shared}
            type="range"
            name={name && `${name}.max`}
            aria-label={fieldText.maximum}
            aria-valuetext={formatValue(high)}
            value={high}
            onChange={(e) => setValue([low, Math.max(e.target.valueAsNumber, low)])}
          />
        </div>
        <output className="shrink-0 text-sm tabular-nums">
          {formatValue(low)} – {formatValue(high)}
        </output>
      </div>
      <Marks marks={marks} format={formatValue} />
    </FieldShell>
  );
}
