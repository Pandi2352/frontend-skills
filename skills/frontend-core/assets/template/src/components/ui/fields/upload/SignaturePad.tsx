import { useRef, useState, type PointerEvent, type Ref } from 'react';
import { Button } from '@/components/ui/button';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { FieldShell, HiddenInputs, innerInputClass, frameClass, useField, type BaseFieldProps, type ValueProps } from '../base';

export interface SignaturePadProps extends BaseFieldProps, ValueProps<string | null> {
  /** Lets people who cannot draw type their name. */
  allowTyping?: boolean;
  ref?: Ref<HTMLInputElement>;
}

function pen(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (context) {
    const color = getComputedStyle(canvas).color;
    Object.assign(context, {
      lineWidth: 3, lineCap: 'round', lineJoin: 'round', strokeStyle: color, fillStyle: color,
    });
  }
  return context;
}

function writeName(canvas: HTMLCanvasElement | null, text: string) {
  const context = canvas && pen(canvas);
  if (!canvas || !context || !text.trim()) return null;
  context.font = 'italic 80px cursive';
  context.textBaseline = 'middle';
  context.fillText(text, 40, canvas.height / 2, canvas.width - 80);
  return canvas.toDataURL('image/png');
}

/** Value: PNG data URL or null. */
export function SignaturePad(props: SignaturePadProps) {
  const { shell, state, controlClassName, rest } = useField(props);
  const { allowTyping = true, name, onBlur, ref } = rest;
  const [value, setValue] = useControllableState<string | null>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? null,
    onChange: rest.onChange,
  });
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const editable = !state.disabled && !state.readOnly;

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const { width, height } = event.currentTarget;
    return {
      x: ((event.clientX - box.left) / box.width) * width,
      y: ((event.clientY - box.top) / box.height) * height,
    };
  };
  const wipe = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };
  const clear = () => {
    wipe();
    setTypedName('');
    setValue(null);
  };
  const finish = () => {
    if (!drawing.current || !canvasRef.current) return;
    drawing.current = false;
    setValue(canvasRef.current.toDataURL('image/png'));
    onBlur?.();
  };

  return (
    <FieldShell shell={shell} group="group">
      <div className="relative">
        {/* The typed name below is the keyboard alternative to drawing. */}
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          aria-label={fieldText.signHere}
          role="img"
          onPointerDown={(event) => {
            if (!editable) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drawing.current = true;
            const { x, y } = point(event);
            const context = pen(event.currentTarget);
            context?.beginPath();
            context?.moveTo(x, y);
          }}
          onPointerMove={(event) => {
            if (!drawing.current) return;
            const { x, y } = point(event);
            const context = event.currentTarget.getContext('2d');
            context?.lineTo(x, y);
            context?.stroke();
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
          className={cn(
            'h-32 w-full touch-none rounded-md border bg-surface text-foreground',
            state.invalid ? 'border-danger' : 'border-control-line',
            editable ? 'cursor-crosshair' : 'cursor-not-allowed bg-subtle',
            controlClassName,
          )}
        />
        {!value && (
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-placeholder">
            {fieldText.signHere}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {allowTyping && (
          <div className={frameClass(state)}>
            <input
              ref={ref}
              type="text"
              aria-label={fieldText.typeName}
              placeholder={fieldText.typeName}
              autoComplete="name"
              disabled={state.disabled}
              readOnly={state.readOnly}
              value={typedName}
              className={innerInputClass}
              onBlur={onBlur}
              onChange={(event) => {
                const text = event.target.value;
                setTypedName(text);
                wipe();
                setValue(writeName(canvasRef.current, text));
              }}
            />
          </div>
        )}
        <Button variant="outline" disabled={!editable || !value} onClick={clear}>
          {fieldText.clear}
        </Button>
      </div>
      <HiddenInputs name={name} values={value ? [value] : []} disabled={state.disabled} />
    </FieldShell>
  );
}
