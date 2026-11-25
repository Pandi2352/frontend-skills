import { Check, CircleAlert } from 'lucide-react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';

export interface Step {
  id: string;
  label: string;
  description?: string;
  /** Something in this step must be fixed. */
  error?: boolean;
}

export interface StepperProps {
  label: string;
  steps: Step[];
  /** Index of the open step. */
  current: number;
  /** Highest step reached; earlier ones can be opened. */
  reached?: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

/** Shows progress. On phones the name of the current step is above. */
export function Stepper({ label, steps, current, reached = current, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label={label} className={className}>
      <p className="pb-2 text-sm text-muted md:hidden">{uiText.stepOf(current + 1, steps.length)}: <span className="font-medium text-foreground">{steps[current]?.label}</span></p>
      <ol className="flex items-center gap-2 md:gap-4">
        {steps.map((step, i) => {
          const isCurrent = i === current;
          const isDone = i < reached && !isCurrent && !step.error;
          const canOpen = !!onStepClick && i <= reached && !isCurrent;
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                  isCurrent && 'border-primary bg-primary text-on-primary',
                  isDone && 'border-primary text-primary',
                  step.error && !isCurrent && 'border-danger text-danger',
                  !isCurrent && !isDone && !step.error && 'border-control-line text-muted',
                )}
              >
                {step.error ? <CircleAlert className="size-4" /> : isDone ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="hidden min-w-0 text-start text-sm md:block">
                <span className={cn('block truncate', isCurrent && 'font-medium')}>{step.label}</span>
                {step.description && <span className="hidden truncate text-xs text-muted md:block">{step.description}</span>}
              </span>
              {(isDone || step.error) && <span className="sr-only"> ({step.error ? uiText.stepError : uiText.stepDone})</span>}
            </>
          );
          const look = 'flex min-w-0 items-center gap-2 rounded-md';
          return (
            <li key={step.id} aria-current={isCurrent ? 'step' : undefined} className="flex min-w-0 items-center gap-2 not-last:flex-1 md:gap-4">
              {canOpen ? (
                <button
                  type="button"
                  aria-label={step.label}
                  onClick={() => onStepClick(i)}
                  className={cn(look, 'hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus')}
                >
                  {content}
                </button>
              ) : (
                <span className={look}>{content}</span>
              )}
              {i < steps.length - 1 && <span aria-hidden className={cn('h-px min-w-2 flex-1', i < reached ? 'bg-primary' : 'bg-line')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
