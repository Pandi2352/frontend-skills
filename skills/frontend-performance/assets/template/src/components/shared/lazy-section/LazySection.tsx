import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { cn } from '@/lib/cn';

export interface LazySectionProps {
  /** Heavy content, usually a React.lazy component: chart, map, editor. */
  children: ReactNode;
  /** Same size as the content, so the page does not jump. */
  fallback: ReactNode;
  /** How early to start, in pixels before it becomes visible. */
  margin?: number;
  className?: string;
}

/** Loads and draws its content only when it is nearly on screen. A failure stays inside. */
export function LazySection({ children, fallback, margin = 300, className }: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: `${margin}px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near, margin]);

  return (
    <div ref={ref} className={cn('min-w-0', className)}>
      {near ? (
        <ErrorBoundary>
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
