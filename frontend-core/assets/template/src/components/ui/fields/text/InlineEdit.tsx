import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/ui/button';
import { fieldText } from '@/constants/field-text';
import { Input, type InputProps } from './Input';

export interface InlineEditProps
  extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'label' | 'ref'> {
  label: string;
  value: string;
  /** Throw to keep editing; the message is shown below the field. */
  onSave: (value: string) => void | Promise<void>;
  emptyText?: string;
  /** Return a message to stop the save. */
  validate?: (value: string) => string | undefined;
}

export function InlineEdit(props: InlineEditProps) {
  const { value, onSave, emptyText = '—', validate, label, error, ...rest } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const [problem, setProblem] = useState<string>();
  const [saving, setSaving] = useState(false);

  const close = () => {
    setDraft(null);
    setProblem(undefined);
  };
  const save = async () => {
    if (draft === null || saving) return;
    const message = validate?.(draft);
    if (message) return setProblem(message);
    if (draft === value) return close();
    setSaving(true);
    try {
      await onSave(draft);
      close();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (draft === null) {
    return (
      <div className={rest.className}>
        <span className="text-sm font-medium">{label}</span>
        <div className="flex min-h-control items-center gap-1 text-sm">
          <span className="min-w-0 break-words">{value || emptyText}</span>
          {!rest.disabled && !rest.readOnly && (
            <IconButton
              icon={Pencil}
              size="sm"
              label={fieldText.edit(label)}
              onClick={() => setDraft(value)}
            />
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-1">
      <Input
        {...rest}
        // Editing was requested by the person, so focus belongs here.
        ref={(node) => {
          if (node && document.activeElement === document.body) node.focus();
        }}
        className="flex-1"
        label={label}
        value={draft}
        loading={saving}
        error={problem ?? error}
        onChange={(event) => {
          setDraft(event.target.value);
          setProblem(undefined);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void save();
          }
          if (event.key === 'Escape') close();
        }}
        action={
          <>
            <IconButton icon={Check} size="sm" className="size-7" label={fieldText.save} onClick={() => void save()} />
            <IconButton icon={X} size="sm" className="size-7" label={fieldText.cancel} onClick={close} />
          </>
        }
      />
    </div>
  );
}
