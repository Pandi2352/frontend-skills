import { CircleAlert } from 'lucide-react';
import { useRef, type FormHTMLAttributes, type ReactNode } from 'react';
import {
  FormProvider, type FieldPath, type FieldValues, type SubmitHandler, type UseFormReturn,
} from 'react-hook-form';
import { cn } from '@/lib/cn';

/** What a service should throw when the server rejects a form. */
export class FormSubmitError extends Error {
  fieldErrors: Record<string, string>;
  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'FormSubmitError';
    this.fieldErrors = fieldErrors;
  }
}

/** Any error that carries `fieldErrors`: FormSubmitError, or ApiError from the API client. */
function readFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof Error) || !('fieldErrors' in error)) return {};
  return (error.fieldErrors ?? {}) as Record<string, string>;
}

export interface FormProps<V extends FieldValues>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: UseFormReturn<V>;
  onSubmit: SubmitHandler<V>;
  /** Shown when the failure has no message. */
  fallbackError?: string;
  children: ReactNode;
}

/**
 * Submits once, focuses the first invalid field, puts server errors below their
 * fields, and shows everything else at the top.
 */
export function Form<V extends FieldValues>(props: FormProps<V>) {
  const { form, onSubmit, fallbackError = 'Something went wrong. Try again.', children, className, ...rest } = props;
  const rootError = form.formState.errors.root?.message;

  const busy = useRef(false);

  const submit = form.handleSubmit(async (values, event) => {
    try {
      await onSubmit(values, event);
    } catch (e) {
      let first = true;
      const unmatched: string[] = [];
      for (const [name, message] of Object.entries(readFieldErrors(e))) {
        const path = name as FieldPath<V>;
        if (form.getFieldState(path) && (name.split('.')[0] ?? '') in values) {
          form.setError(path, { type: 'server', message }, { shouldFocus: first });
          first = false;
        } else unmatched.push(message);
      }
      const general = [e instanceof Error ? e.message : '', ...unmatched].filter(Boolean).join(' ');
      if (first || unmatched.length) form.setError('root', { message: general || fallbackError });
    }
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        {...rest}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          try {
            await submit(event);
          } finally {
            busy.current = false;
          }
        }}
        className={cn('flex flex-col gap-6', className)}
      >
        {rootError && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-danger p-3 text-sm text-danger">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {rootError}
          </div>
        )}
        {children}
      </form>
    </FormProvider>
  );
}
