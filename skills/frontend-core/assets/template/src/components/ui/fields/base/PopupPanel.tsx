import { FloatingFocusManager, FloatingNode, FloatingPortal } from '@floating-ui/react';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';
import { cn } from '@/lib/cn';
import { popupClass } from './field.styles';
import type { Popup } from './usePopup';

interface PopupPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {
  popup: Popup;
  className?: string;
  /** Move focus into the popup when it opens, and back when it closes. */
  moveFocus?: boolean;
  /** -1 when the content focuses itself. */
  initialFocus?: RefObject<HTMLElement | null> | number;
  children: ReactNode;
}

export function PopupPanel(props: PopupPanelProps) {
  const { popup, moveFocus = true, initialFocus, children, className, ...rest } = props;
  const { open, nodeId, context, floatingStyles, setFloating, getFloatingProps } = popup;
  if (!open) return null;

  const panel = (
    <div
      ref={setFloating}
      style={floatingStyles}
      className={cn(popupClass, className)}
      {...getFloatingProps(rest)}
    >
      {children}
    </div>
  );
  return (
    <FloatingNode id={nodeId}>
    <FloatingPortal>
      {moveFocus ? (
        <FloatingFocusManager
          context={context}
          modal={false}
          {...(initialFocus === undefined ? {} : { initialFocus })}
        >
          {panel}
        </FloatingFocusManager>
      ) : (
        panel
      )}
    </FloatingPortal>
    </FloatingNode>
  );
}
