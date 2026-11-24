import { Palette } from 'lucide-react';
import { useState, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import {
  ControlFrame, FieldShell, HiddenInputs, PopupPanel, focusRing, frameButtonClass, innerInputClass,
  useField, usePopup, type BaseFieldProps, type ValueProps,
} from '../base';

const defaultSwatches = [
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7',
  '#2563eb', '#7c3aed', '#c026d3', '#db2777', '#475569', '#000000',
];

export function normalizeHex(text: string): string | null {
  const hex = text.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`;
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

function toHsl(hex: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (!d) return [0, 0, Math.round(l * 100)];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

function fromHsl(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export interface ColorPickerProps extends BaseFieldProps, ValueProps<string | null> {
  swatches?: string[];
  clearable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Value: "#2563eb" or null. */
export function ColorPicker(props: ColorPickerProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const { swatches = defaultSwatches, clearable, name, onBlur, ref } = rest;
  const [value, setValue] = useControllableState<string | null>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? null,
    onChange: rest.onChange,
  });
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popup = usePopup({ open, onOpenChange: setOpen });
  const { setReference } = popup;
  const editable = !state.disabled && !state.readOnly;
  // Kept apart from the hex, so hue is not lost when the color becomes gray.
  const [hsl, setHsl] = useState<[number, number, number]>([220, 80, 50]);
  const sliders = [
    { label: fieldText.hue, max: 360 },
    { label: fieldText.saturation, max: 100 },
    { label: fieldText.lightness, max: 100 },
  ];

  return (
    <FieldShell shell={shell}>
      <ControlFrame
        ref={setReference}
        state={state}
        className={controlClassName}
        onClear={
          clearable && value
            ? () => {
                setDraft(null);
                setValue(null);
              }
            : undefined
        }
        action={
          <button
            type="button"
            aria-label={fieldText.chooseColor}
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={!editable}
            onClick={() => {
              if (value) setHsl(toHsl(value));
              setOpen(!open);
            }}
            className={frameButtonClass}
          >
            <Palette aria-hidden className="size-4" />
          </button>
        }
      >
        <span
          aria-hidden
          className="ml-3 size-5 shrink-0 rounded-md border border-control-line"
          style={{ backgroundColor: value ?? 'transparent' }}
        />
        <input
          {...aria}
          ref={ref}
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="#2563eb"
          maxLength={7}
          disabled={state.disabled}
          readOnly={state.readOnly}
          value={draft ?? value ?? ''}
          onChange={(event) => {
            setDraft(event.target.value);
            const hex = normalizeHex(event.target.value);
            if (hex) setValue(hex);
            else if (!event.target.value) setValue(null);
          }}
          onBlur={() => {
            setDraft(null);
            onBlur?.();
          }}
          className={cn(innerInputClass, 'pl-2')}
        />
      </ControlFrame>
      <HiddenInputs name={name} values={value ? [value] : []} disabled={state.disabled} />
      <PopupPanel popup={popup} role="dialog" aria-label={fieldText.chooseColor} className="w-64 p-3">
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={color === value}
              onClick={() => {
                setValue(color);
                setDraft(null);
                setHsl(toHsl(color));
              }}
              style={{ backgroundColor: color }}
              className={cn('size-8 rounded-md border border-control-line', focusRing, color === value && 'outline-2 outline-offset-2 outline-focus')}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-3">
          {sliders.map(({ label, max }, i) => (
            <label key={label} className="flex items-center gap-2 text-xs">
              <span className="w-20">{label}</span>
              <input
                type="range"
                min={0}
                max={max}
                value={hsl[i]}
                onChange={(event) => {
                  const next: [number, number, number] = [...hsl];
                  next[i] = event.target.valueAsNumber;
                  setHsl(next);
                  setDraft(null);
                  setValue(fromHsl(...next));
                }}
                className={cn('min-w-0 flex-1 accent-primary', focusRing)}
              />
            </label>
          ))}
        </div>
      </PopupPanel>
    </FieldShell>
  );
}
