import { CircleCheck, FileText, RotateCw, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type Ref } from 'react';
import { IconButton } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loader';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { formatFileSize } from '@/utils/format-file-size';
import { FieldShell, useField, type BaseFieldProps, type ValueProps } from '../base';
import { FilePreview } from './FilePreview';
import { checkFiles, type FileRules } from './file-rules';

export interface FileUploadProps extends BaseFieldProps, FileRules, ValueProps<File[]> {
  multiple?: boolean;
  /** Starts as soon as a file is added. Without it, files wait for submit. */
  upload?: (
    file: File,
    options: { onProgress: (percent: number) => void; signal: AbortSignal },
  ) => Promise<void>;
  /** Files already on the server. */
  existing?: { id: string; name: string; size?: number; url?: string }[];
  onRemoveExisting?: (id: string) => void;
  /** One-line button instead of the drop area. */
  compact?: boolean;
  ref?: Ref<HTMLInputElement>;
}

type Progress = { status: 'uploading' | 'done' | 'failed'; percent: number; message?: string };

export function FileUpload(props: FileUploadProps) {
  const [problems, setProblems] = useState<string[]>([]);
  const own = props.error ? [props.error].flat() : [];
  const { shell, aria, state, controlClassName, rest } = useField({
    ...props,
    error: [...own, ...problems],
  });
  const { multiple = false, accept, maxSize, upload, existing = [], onRemoveExisting, compact, name, ref } = rest;
  const maxFiles = multiple ? rest.maxFiles : 1;
  const [files, setFiles] = useControllableState<File[]>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? [],
    onChange: rest.onChange,
  });
  const [progress, setProgress] = useState(new Map<File, Progress>());
  const [dragging, setDragging] = useState(false);
  const controllers = useRef(new Map<File, AbortController>());
  const editable = !state.disabled && !state.readOnly;

  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((c) => c.abort());
  }, []);

  const track = (file: File, next: Progress) =>
    setProgress((map) => new Map(map).set(file, next));

  const start = async (file: File) => {
    if (!upload) return;
    const controller = new AbortController();
    controllers.current.set(file, controller);
    track(file, { status: 'uploading', percent: 0 });
    try {
      await upload(file, {
        signal: controller.signal,
        onProgress: (percent) => {
          if (!controller.signal.aborted) track(file, { status: 'uploading', percent });
        },
      });
      if (!controller.signal.aborted) track(file, { status: 'done', percent: 100 });
    } catch (e) {
      if (controller.signal.aborted) return;
      track(file, {
        status: 'failed',
        percent: 0,
        message: e instanceof Error && e.message ? e.message : fieldText.uploadFailed,
      });
    } finally {
      controllers.current.delete(file);
    }
  };

  const add = (list: FileList | null) => {
    if (!list || !editable) return;
    // A single-file field replaces its file.
    const kept = multiple ? files : [];
    const left = maxFiles === undefined ? undefined : maxFiles - (multiple ? existing.length : 0);
    const result = checkFiles([...list].slice(0, multiple ? undefined : 1), kept, {
      accept, maxSize, maxFiles: left,
    });
    setProblems(result.problems);
    if (!result.accepted.length) return;
    if (!multiple) files.forEach((f) => controllers.current.get(f)?.abort());
    setFiles([...kept, ...result.accepted]);
    result.accepted.forEach((f) => void start(f));
  };

  const remove = (file: File) => {
    controllers.current.get(file)?.abort();
    setProgress((map) => {
      const next = new Map(map);
      next.delete(file);
      return next;
    });
    setProblems([]);
    setFiles(files.filter((f) => f !== file));
  };

  const hint = [accept?.replaceAll(',', ', '), maxSize !== undefined && fieldText.upTo(formatFileSize(maxSize))]
    .filter(Boolean)
    .join(', ');

  return (
    <FieldShell
      shell={shell}
      count={
        multiple && maxFiles !== undefined
          ? { current: files.length + existing.length, max: maxFiles }
          : undefined
      }
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (editable) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(event.dataTransfer.files);
        }}
        className={cn(
          'relative flex items-center rounded-md border text-sm',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
          compact ? 'h-control gap-2 px-3' : 'flex-col justify-center gap-1 border-dashed p-6 text-center',
          state.invalid ? 'border-danger' : 'border-control-line',
          dragging ? 'bg-primary-subtle' : editable ? 'bg-surface hover:bg-subtle' : 'bg-subtle text-muted',
          controlClassName,
        )}
      >
        <Upload aria-hidden className={cn('shrink-0 text-muted', compact ? 'size-4' : 'size-6')} />
        <span>
          {!compact && `${fieldText.dropFiles} `}
          <span className={cn('font-medium', editable && 'text-primary underline')}>{fieldText.browse}</span>
        </span>
        {hint && <span className="truncate text-xs text-muted">{hint}</span>}
        {/* The real input covers the area, so click, keyboard and screen readers all work. */}
        <input
          {...aria}
          aria-required={undefined}
          ref={ref}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={!editable}
          title=""
          onChange={(event) => {
            add(event.target.files);
            event.target.value = '';
          }}
          onBlur={rest.onBlur}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>

      {(files.length > 0 || existing.length > 0) && (
        <ul className="flex flex-col gap-2">
          {existing.map((item) => (
            <li key={item.id} className="flex min-h-control-lg items-center gap-3 rounded-md border border-line bg-surface px-3 text-sm">
              <FileText aria-hidden className="size-5 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </span>
              {item.size !== undefined && <span className="text-xs text-muted">{formatFileSize(item.size)}</span>}
              {editable && onRemoveExisting && (
                <IconButton icon={X} size="sm" label={fieldText.remove(item.name)} onClick={() => onRemoveExisting(item.id)} />
              )}
            </li>
          ))}
          {files.map((file) => {
            const p = progress.get(file);
            return (
              <li key={`${file.name}-${file.size}-${file.lastModified}`} className="rounded-md border border-line bg-surface px-3 text-sm">
                <div className="flex min-h-control-lg items-center gap-3">
                  {file.type.startsWith('image/') ? (
                    <FilePreview file={file} alt="" className="size-8 rounded-md" />
                  ) : (
                    <FileText aria-hidden className="size-5 shrink-0 text-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted">{formatFileSize(file.size)}</span>
                  {p?.status === 'uploading' && <Spinner label={`${fieldText.loading} ${file.name}`} />}
                  {p?.status === 'done' && (
                    <span role="status">
                      <CircleCheck aria-hidden className="size-4 text-success" />
                      <span className="sr-only">{fieldText.uploaded}: {file.name}</span>
                    </span>
                  )}
                  {p?.status === 'failed' && (
                    <IconButton icon={RotateCw} size="sm" label={`${fieldText.retry}: ${file.name}`} onClick={() => void start(file)} />
                  )}
                  {editable && (
                    <IconButton icon={X} size="sm" label={fieldText.remove(file.name)} onClick={() => remove(file)} />
                  )}
                </div>
                {p?.status === 'uploading' && (
                  <div
                    role="progressbar"
                    aria-label={file.name}
                    aria-valuenow={Math.round(p.percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mb-2 h-1 overflow-hidden rounded-md bg-line"
                  >
                    <div className="h-full bg-primary" style={{ width: `${p.percent}%` }} />
                  </div>
                )}
                {p?.status === 'failed' && (
                  <p role="alert" className="pb-2 text-xs text-danger">
                    {p.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </FieldShell>
  );
}
