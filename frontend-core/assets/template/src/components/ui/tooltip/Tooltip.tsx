import {
  FloatingPortal, autoUpdate, flip, offset, shift, useDismiss, useFloating, useFocus, useHover,
  useInteractions, type Placement,
} from '@floating-ui/react';
import { cloneElement, useId, useState, type ReactElement } from 'react';

export interface TooltipProps {
  text: string;
  placement?: Placement;
  delay?: number;
  disabled?: boolean;
  className?: string;
  /** One focusable element. */
  children: ReactElement<{ 'aria-describedby'?: string | undefined }>;
}

/** Short extra text on hover and focus. Never the only place for important information. */
export function Tooltip(props: TooltipProps) {
  const { text, placement = 'top', delay = 400, disabled, className, children } = props;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState<HTMLElement | null>(null);
  const [floating, setFloating] = useState<HTMLElement | null>(null);
  const { floatingStyles, context } = useFloating({
    open: open && !disabled,
    onOpenChange: setOpen,
    placement,
    elements: { reference, floating },
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: { open: delay }, move: false }),
    useFocus(context),
    useDismiss(context),
  ]);
  return (
    <>
      <span ref={setReference} className={className ?? 'inline-flex'} {...getReferenceProps()}>
        {cloneElement(children, open && !disabled ? { 'aria-describedby': id } : {})}
      </span>
      {open && !disabled && (
        <FloatingPortal>
          <div
            ref={setFloating}
            id={id}
            role="tooltip"
            style={floatingStyles}
            className="pointer-events-none z-(--z-tooltip) max-w-xs rounded-md bg-foreground px-2 py-1 text-xs text-surface"
            {...getFloatingProps()}
          >
            {text}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
