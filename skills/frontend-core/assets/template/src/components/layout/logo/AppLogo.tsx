import { appConfig } from '@/config/app.config';
import { cn } from '@/lib/cn';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'A';

/** Mark and name. Replace the mark with the real logo (an SVG in src/assets) when there is one. */
export function AppLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M0 22 32 10v14a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8z" className="fill-on-primary" opacity=".14" />
        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-on-primary">
          {initials(appConfig.name)}
        </text>
      </svg>
      <span className={compact ? 'sr-only' : 'truncate text-[0.9375rem] font-semibold tracking-tight'}>{appConfig.name}</span>
    </span>
  );
}
