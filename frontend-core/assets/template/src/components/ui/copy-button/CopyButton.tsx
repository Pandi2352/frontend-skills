import { Check, Copy, X } from 'lucide-react';
import { uiText } from '@/constants/ui-text';
import { useClipboard } from '@/hooks/useClipboard';
import { Button, IconButton, type ButtonProps } from '../button';

export interface CopyButtonProps extends Pick<ButtonProps, 'variant' | 'size' | 'className' | 'disabled'> {
  text: string;
  /** What is copied, e.g. "Copy order number". */
  label?: string;
  /** Only the icon. */
  iconOnly?: boolean;
}

/** The result is shown and announced. */
export function CopyButton({ text, label = uiText.copy, iconOnly, variant = 'ghost', ...rest }: CopyButtonProps) {
  const { copy, state } = useClipboard();
  const icon = { idle: Copy, copied: Check, failed: X }[state];
  const shown = { idle: label, copied: uiText.copied, failed: uiText.copyFailed }[state];
  return (
    <>
      {iconOnly ? (
        <IconButton {...rest} variant={variant} icon={icon} label={label} onClick={() => void copy(text)} />
      ) : (
        <Button {...rest} variant={variant} leftIcon={icon} onClick={() => void copy(text)}>
          {shown}
        </Button>
      )}
      <span role="status" className="sr-only">
        {state === 'idle' ? '' : shown}
      </span>
    </>
  );
}
