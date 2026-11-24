import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { fieldText } from '@/constants/field-text';
import { cn } from '@/lib/cn';
import { frameButtonClass } from './field.styles';
import { PopupPanel } from './PopupPanel';
import type { ShellProps } from './useField';
import { usePopup } from './usePopup';

function InfoTip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const popup = usePopup({ open, onOpenChange: setOpen });
  const { setReference, getReferenceProps } = popup;
  return (
    <>
      <button
        type="button"
        ref={setReference}
        aria-label={fieldText.moreInfo}
        aria-expanded={open}
        className={cn(frameButtonClass, '-my-1 size-6')}
        {...getReferenceProps({ onClick: () => setOpen(!open) })}
      >
        <Info aria-hidden className="size-4" />
      </button>
      <PopupPanel popup={popup} className="max-w-xs p-3" role="dialog" aria-label={fieldText.moreInfo}>
        {children}
      </PopupPanel>
    </>
  );
}

function Message(props: { icon: LucideIcon; tone: string; children: ReactNode }) {
  const { icon: Icon, tone, children } = props;
  return (
    <p className={cn('flex items-start gap-1 text-xs', tone)}>
      <Icon aria-hidden className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

interface FieldShellProps {
  shell: ShellProps;
  children: ReactNode;
  /** Set for fields made of several controls (radios, checkboxes, sliders). */
  group?: 'group' | 'radiogroup';
  /** The field draws its own label beside the control (checkbox, switch). */
  inlineLabel?: boolean;
  count?: { current: number; max?: number | undefined } | undefined;
  /** Between the control and its messages, e.g. password strength. */
  footer?: ReactNode;
}

/** Label, required mark, control, error/warning/success, helper and counter. */
export function FieldShell(props: FieldShellProps) {
  const { shell, children, group, inlineLabel, count, footer } = props;
  const { ids, errors, warning, success, helperText, required } = shell;
  const horizontal = shell.layout === 'horizontal';
  const labelContent = (
    <>
      {shell.label}
      {required && (
        <span className="text-danger" aria-hidden>
          {' *'}
        </span>
      )}
      {required && group === 'group' && <span className="sr-only"> ({fieldText.required})</span>}
      {shell.optionalText && <span className="font-normal text-muted"> {shell.optionalText}</span>}
    </>
  );
  const labelClass = cn('text-sm font-medium', shell.disabled && 'text-muted');

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1.5',
        horizontal && 'md:grid md:grid-cols-[12rem_1fr] md:items-start md:gap-x-4',
        shell.className,
      )}
      {...(group && {
        role: group,
        id: ids.control,
        'aria-labelledby': ids.label,
        'aria-describedby': shell.describedBy,
        ...(group === 'radiogroup' && {
          'aria-required': required || undefined,
          'aria-invalid': errors.length > 0 || undefined,
        }),
      })}
    >
      {!inlineLabel && (
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          horizontal && 'md:min-h-control',
          shell.hideLabel && 'sr-only',
        )}
      >
        <span className="inline-flex items-center gap-1">
          {group ? (
            <span id={ids.label} className={labelClass}>
              {labelContent}
            </span>
          ) : (
            <label id={ids.label} htmlFor={ids.control} className={labelClass}>
              {labelContent}
            </label>
          )}
          {shell.info && <InfoTip>{shell.info}</InfoTip>}
        </span>
        {shell.labelAction && <span className="text-sm">{shell.labelAction}</span>}
      </div>
      )}

      <div className="flex min-w-0 flex-col gap-1.5">
        {children}
        {footer}
        <div aria-live="polite" id={ids.message} className="flex flex-col gap-1 empty:hidden">
          {errors.map((e) => (
            <Message key={e} icon={CircleAlert} tone="text-danger">
              {e}
            </Message>
          ))}
          {!errors.length && warning && (
            <Message icon={TriangleAlert} tone="text-warning">
              {warning}
            </Message>
          )}
          {!errors.length && !warning && success && (
            <Message icon={CircleCheck} tone="text-success">
              {success}
            </Message>
          )}
        </div>
        {(helperText || count) && (
          <div className="flex items-start justify-between gap-4 text-xs text-muted">
            <div id={ids.helper} className="min-w-0">
              {helperText}
            </div>
            {count && (
              <span className="shrink-0 tabular-nums">
                {count.current}
                {count.max !== undefined && ` / ${count.max}`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
