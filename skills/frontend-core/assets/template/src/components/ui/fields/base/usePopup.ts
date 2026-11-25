import {
  autoUpdate, flip, offset, shift, size, useDismiss, useFloating, useFloatingNodeId,
  useInteractions,
} from '@floating-ui/react';
import { useState } from 'react';

/** Position, outside click and Escape for every field popup. */
export function usePopup(options: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchWidth?: boolean;
  maxHeight?: number;
}) {
  const { open, onOpenChange, matchWidth = false, maxHeight = 320 } = options;
  const [reference, setReference] = useState<HTMLElement | null>(null);
  const [floating, setFloating] = useState<HTMLElement | null>(null);
  // Part of the tree of a surrounding Modal, so the Modal does not close with it.
  const nodeId = useFloatingNodeId();
  const { floatingStyles, context } = useFloating({
    ...(nodeId ? { nodeId } : {}),
    elements: { reference, floating },
    open,
    onOpenChange,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, availableHeight, availableWidth, elements }) {
          elements.floating.style.maxHeight = `${Math.max(120, Math.min(availableHeight, maxHeight))}px`;
          elements.floating.style.maxWidth = `${availableWidth}px`;
          if (matchWidth) elements.floating.style.width = `${rects.reference.width}px`;
        },
      }),
    ],
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context)]);

  return {
    open,
    nodeId,
    context,
    floatingStyles,
    setReference,
    setFloating,
    getReferenceProps,
    getFloatingProps,
  };
}

export type Popup = ReturnType<typeof usePopup>;
