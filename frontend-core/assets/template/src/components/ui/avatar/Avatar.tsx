import { useState } from 'react';
import { cn } from '@/lib/cn';

export interface AvatarProps {
  name: string;
  src?: string | undefined;
  size?: 'sm' | 'md' | 'lg';
  /** true when the name is already visible next to it. */
  decorative?: boolean;
  className?: string;
}

const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-lg' };

export const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return [words[0], words.length > 1 ? words.at(-1) : undefined]
    .map((w) => (w ? ([...w][0] ?? '') : ''))
    .join('')
    .toUpperCase();
};

/** Shows initials when there is no image or it fails. */
export function Avatar({ name, src, size = 'md', decorative, className }: AvatarProps) {
  const [failed, setFailed] = useState<string>();
  return (
    <span
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name })}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-on-secondary',
        sizes[size],
        className,
      )}
    >
      {src && src !== failed ? (
        <img src={src} alt="" onError={() => setFailed(src)} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{getInitials(name)}</span>
      )}
    </span>
  );
}
