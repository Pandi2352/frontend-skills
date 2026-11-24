import { cn } from '@/lib/cn';
import { Dialog, type DialogProps } from './Dialog';

const widths = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-5xl',
  full: 'sm:h-full sm:max-w-none',
};

export interface ModalProps extends DialogProps {
  size?: keyof typeof widths;
  /** Fills the phone screen. Good for forms. */
  fullScreenOnMobile?: boolean;
  role?: 'dialog' | 'alertdialog';
}

export function Modal({ size = 'md', fullScreenOnMobile, ...props }: ModalProps) {
  return (
    <Dialog
      {...props}
      overlayClassName={cn('items-center justify-center sm:p-4', !fullScreenOnMobile && 'p-4')}
      panelClassName={cn(
        'w-full border sm:max-h-full sm:rounded-md',
        fullScreenOnMobile ? 'h-full sm:h-auto' : 'max-h-full rounded-md',
        widths[size],
      )}
    />
  );
}

const sides = {
  left: { overlay: 'justify-start', panel: 'h-full border-r' },
  right: { overlay: 'justify-end', panel: 'h-full border-l' },
  bottom: { overlay: 'items-end', panel: 'max-h-[85dvh] w-full rounded-t-md border-t' },
};
const drawerWidths = { sm: 'max-w-72', md: 'max-w-md', lg: 'max-w-2xl' };

export interface DrawerProps extends DialogProps {
  side?: keyof typeof sides;
  size?: keyof typeof drawerWidths;
}

export function Drawer({ side = 'right', size = 'md', ...props }: DrawerProps) {
  return (
    <Dialog
      {...props}
      overlayClassName={sides[side].overlay}
      panelClassName={cn(sides[side].panel, side !== 'bottom' && cn('w-[85vw]', drawerWidths[size]))}
    />
  );
}
