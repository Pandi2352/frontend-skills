import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { appConfig } from '@/config/app.config';

/** Heading, form and links of every page in AuthLayout. */
export function AuthPage(props: { title: string; description?: ReactNode; children?: ReactNode; footer?: ReactNode }) {
  const { title, description, children, footer } = props;
  return (
    <div className="flex flex-col gap-6">
      <title>{`${title} · ${appConfig.name}`}</title>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm break-words text-muted">{description}</p>}
      </div>
      {children}
      {footer && <p className="text-center text-sm text-muted">{footer}</p>}
    </div>
  );
}

export function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      className={`rounded-md text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className ?? ''}`}
    />
  );
}
