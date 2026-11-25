import { ImagePlus, X } from 'lucide-react';
import { useState, type Ref } from 'react';
import { Button } from '@/components/ui/button';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { formatFileSize } from '@/utils/format-file-size';
import { FieldShell, useField, type BaseFieldProps, type ValueProps } from '../base';
import { FilePreview } from './FilePreview';
import { checkFiles } from './file-rules';

export interface ImageUploadProps extends BaseFieldProps, ValueProps<File | string | null> {
  shape?: 'square' | 'circle' | 'wide';
  accept?: string;
  maxSize?: number;
  alt?: string;
  ref?: Ref<HTMLInputElement>;
}

const shapes = {
  square: 'size-24 rounded-md',
  circle: 'size-24 rounded-full',
  wide: 'aspect-video w-48 rounded-md',
};

/** Value: a new File, the saved image URL, or null. */
export function ImageUpload(props: ImageUploadProps) {
  const [problem, setProblem] = useState<string>();
  const { shell, aria, state, controlClassName, rest } = useField({
    ...props,
    error: problem ?? props.error,
  });
  const { shape = 'square', accept = 'image/*', maxSize, alt = '', name, ref } = rest;
  const [value, setValue] = useControllableState<File | string | null>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? null,
    onChange: rest.onChange,
  });
  const editable = !state.disabled && !state.readOnly;

  return (
    <FieldShell shell={shell}>
      <div className={cn('flex flex-wrap items-center gap-4', controlClassName)}>
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden border bg-subtle',
            'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
            shapes[shape],
            state.invalid ? 'border-danger' : 'border-control-line',
            !value && 'border-dashed',
          )}
        >
          {value instanceof File ? (
            <FilePreview file={value} alt={alt} className="size-full" />
          ) : value ? (
            <img src={value} alt={alt} className="size-full object-cover" />
          ) : (
            <ImagePlus aria-hidden className="size-6 text-muted" />
          )}
          <input
            {...aria}
            aria-required={undefined}
            ref={ref}
            type="file"
            name={name}
            accept={accept}
            disabled={!editable}
            title=""
            onBlur={rest.onBlur}
            onChange={(event) => {
              const { accepted, problems } = checkFiles([...(event.target.files ?? [])].slice(0, 1), [], { accept, maxSize });
              event.target.value = '';
              setProblem(problems[0]);
              if (accepted[0]) setValue(accepted[0]);
            }}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col items-start gap-1 text-xs text-muted">
          <span className="text-sm">{value ? fieldText.replace : fieldText.chooseImage}</span>
          {maxSize !== undefined && <span>{fieldText.upTo(formatFileSize(maxSize))}</span>}
          {value && editable && (
            <Button size="sm" variant="outline" leftIcon={X} onClick={() => setValue(null)}>
              {fieldText.clear}
            </Button>
          )}
        </div>
      </div>
    </FieldShell>
  );
}

export function AvatarUpload(props: Omit<ImageUploadProps, 'shape'>) {
  return <ImageUpload {...props} shape="circle" />;
}
