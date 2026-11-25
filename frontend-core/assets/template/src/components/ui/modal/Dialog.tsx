import {
  FloatingFocusManager, FloatingNode, FloatingOverlay, FloatingPortal, FloatingTree, useDismiss,
  useFloating, useFloatingNodeId, useFloatingParentNodeId, useInteractions, useRole,
} from '@floating-ui/react';
import { X } from 'lucide-react';
import { useId, useState, type ReactNode, type RefObject } from 'react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { IconButton } from '../button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Return false to stay open, e.g. for unsaved changes. */
  beforeClose?: () => boolean | Promise<boolean>;
  /** Blocks closing while saving. */
  busy?: boolean;
  /** false: only buttons close it, not Escape or a click outside. */
  dismissible?: boolean;
  hideClose?: boolean;
  initialFocus?: RefObject<HTMLElement | null> | number;
  className?: string;
}

interface DialogBaseProps extends DialogProps {
  role?: 'dialog' | 'alertdialog';
  overlayClassName: string;
  panelClassName: string;
}

function DialogInner(props: DialogBaseProps) {
  const {
    open, onClose, title, hideTitle, description, children, footer, beforeClose, busy = false,
    dismissible = true, hideClose, initialFocus, className, role = 'dialog', overlayClassName,
    panelClassName,
  } = props;
  const id = useId();
  const nodeId = useFloatingNodeId();
  const [floating, setFloating] = useState<HTMLElement | null>(null);

  const requestClose = async () => {
    if (busy) return;
    if (beforeClose && !(await beforeClose())) return;
    onClose();
  };
  const { context } = useFloating({
    ...(nodeId ? { nodeId } : {}),
    open,
    onOpenChange: (next) => {
      if (!next) void requestClose();
    },
    elements: { floating },
  });
  const dismiss = useDismiss(context, {
    enabled: dismissible,
    outsidePressEvent: 'mousedown',
    // Pressing a toast must not close the dialog.
    outsidePress: (event) => !(event.target instanceof Element && event.target.closest('[data-toaster]')),
  });
  const { getFloatingProps } = useInteractions([dismiss, useRole(context, { role })]);

  return (
    <FloatingNode id={nodeId}>
      {open && (
        <FloatingPortal>
          <FloatingOverlay lockScroll className={cn('z-(--z-modal) flex bg-backdrop', overlayClassName)}>
            <FloatingFocusManager context={context} {...(initialFocus === undefined ? {} : { initialFocus })}>
              <div
                ref={setFloating}
                {...getFloatingProps()}
                aria-modal
                aria-labelledby={`${id}-title`}
                aria-describedby={description ? `${id}-description` : undefined}
                aria-busy={busy || undefined}
                className={cn('relative flex flex-col border-line bg-surface text-foreground outline-none', panelClassName, className)}
              >
                <div className={cn('shrink-0 border-b border-line p-4 pe-14', hideTitle && 'sr-only')}>
                  <h2 id={`${id}-title`} className="text-lg font-semibold break-words">
                    {title}
                  </h2>
                  {description && (
                    <div id={`${id}-description`} className="text-sm text-muted">
                      {description}
                    </div>
                  )}
                </div>
                {children && <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>}
                {footer && (
                  <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end">
                    {footer}
                  </div>
                )}
                {/* Last in the page order, so focus starts inside the content. */}
                {!hideClose && (
                  <IconButton
                    icon={X}
                    size="sm"
                    label={uiText.close}
                    disabled={busy}
                    className="absolute top-3 end-3"
                    onClick={() => void requestClose()}
                  />
                )}
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </FloatingNode>
  );
}

/** Focus trap, Escape, scroll lock, focus return, and dialogs or popups inside it. */
export function Dialog(props: DialogBaseProps) {
  const inside = useFloatingParentNodeId() !== null;
  const dialog = <DialogInner {...props} />;
  return inside ? dialog : <FloatingTree>{dialog}</FloatingTree>;
}
