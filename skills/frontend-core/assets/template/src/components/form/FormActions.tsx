import type { ReactNode } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { Button } from '@/components/ui/button';

export interface FormActionsProps {
  submitLabel: string;
  cancelLabel?: string;
  onCancel?: () => void;
  /** Disables submit until something changed. */
  requireChanges?: boolean;
  children?: ReactNode;
}

export function FormActions(props: FormActionsProps) {
  const { submitLabel, cancelLabel = 'Cancel', onCancel, requireChanges, children } = props;
  const { control } = useFormContext();
  const { isSubmitting, isDirty } = useFormState({ control });
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
      {onCancel && (
        <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" isLoading={isSubmitting} disabled={!!requireChanges && !isDirty}>
        {submitLabel}
      </Button>
    </div>
  );
}
