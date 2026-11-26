import { ArrowLeft, Home, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/app.config';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/cn';

type Kind = 'notFound' | 'forbidden' | 'error' | 'offline';

/** Drawn with the theme colors, so it fits every color and dark mode. */
function Illustration({ kind }: { kind: Kind }) {
  return (
    <svg aria-hidden viewBox="0 0 240 160" className="h-36 w-auto sm:h-44">
      <ellipse cx="120" cy="142" rx="84" ry="8" className="fill-subtle" />
      <rect x="44" y="20" width="152" height="108" rx="12" className="fill-surface stroke-line" strokeWidth="2" />
      <path d="M44 32a12 12 0 0 1 12-12h128a12 12 0 0 1 12 12v8H44z" className="fill-primary-subtle" />
      <circle cx="58" cy="30" r="3" className="fill-primary" opacity=".5" />
      <circle cx="68" cy="30" r="3" className="fill-primary" opacity=".35" />
      <circle cx="78" cy="30" r="3" className="fill-primary" opacity=".2" />
      {kind === 'notFound' && (
        <g>
          <rect x="64" y="56" width="64" height="8" rx="4" className="fill-subtle" />
          <rect x="64" y="72" width="44" height="8" rx="4" className="fill-subtle" />
          <rect x="64" y="88" width="56" height="8" rx="4" className="fill-subtle" />
          <circle cx="150" cy="84" r="22" className="fill-surface stroke-primary" strokeWidth="6" />
          <path d="m166 100 18 18" className="stroke-primary" strokeWidth="8" strokeLinecap="round" />
          <path d="M144 78a8 8 0 1 1 9 8v4" className="stroke-primary" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="153" cy="96" r="2.5" className="fill-primary" />
        </g>
      )}
      {kind === 'forbidden' && (
        <g>
          <path d="M104 72v-10a16 16 0 0 1 32 0v10" className="stroke-primary" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="92" y="70" width="56" height="42" rx="8" className="fill-primary" />
          <circle cx="120" cy="88" r="5" className="fill-on-primary" />
          <path d="M120 92v8" className="stroke-on-primary" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {kind === 'error' && (
        <g>
          <path d="M120 54 150 108H90z" className="fill-primary-subtle stroke-primary" strokeWidth="5" strokeLinejoin="round" />
          <path d="M120 72v16" className="stroke-primary" strokeWidth="5" strokeLinecap="round" />
          <circle cx="120" cy="98" r="3.5" className="fill-primary" />
          <path d="M64 60h14M64 74h8M162 92h14M168 106h8" className="stroke-line" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {kind === 'offline' && (
        <g fill="none" strokeLinecap="round" strokeWidth="6">
          <path d="M84 76a52 52 0 0 1 72 0" className="stroke-line" />
          <path d="M96 88a34 34 0 0 1 48 0" className="stroke-primary" opacity=".6" />
          <path d="M108 100a16 16 0 0 1 24 0" className="stroke-primary" />
          <path d="m80 56 80 56" className="stroke-primary" />
        </g>
      )}
    </svg>
  );
}

const action = 'inline-flex h-control items-center justify-center gap-2 rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
const primary = cn(action, 'bg-primary text-on-primary hover:bg-primary-hover');
const outline = cn(action, 'border border-control-line bg-surface text-foreground hover:bg-subtle');

interface StatusViewProps {
  kind: Kind;
  code?: string | number;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** Outside the app frame: fills the whole window. */
  fullScreen?: boolean;
}

/** Centered in the space it gets: the page area, or the whole window. */
export function StatusView({ kind, code, title, description, actions, fullScreen = false }: StatusViewProps) {
  return (
    <div className={cn('grid w-full place-items-center bg-page p-6', fullScreen ? 'min-h-dvh' : 'min-h-full py-12')}>
      <title>{`${title} · ${appConfig.name}`}</title>
      <div className="flex max-w-md flex-col items-center text-center">
        <Illustration kind={kind} />
        {code !== undefined && <p className="mt-6 text-sm font-semibold tracking-widest text-primary">{code}</p>}
        <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">{title}</h1>
        <p className="mt-3 text-muted text-pretty">{description}</p>
        {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <Button variant="outline" leftIcon={ArrowLeft} onClick={() => void navigate(-1)}>
      Go back
    </Button>
  );
}

const homeLink = (
  <Link to={ROUTES.home} className={primary}>
    <Home aria-hidden className="size-4" />
    Go to the start page
  </Link>
);

export function NotFoundPage() {
  return (
    <StatusView
      kind="notFound"
      code="404"
      title="Page not found"
      description="The address may be wrong, or the page was moved or deleted."
      actions={<>{homeLink}<BackButton /></>}
    />
  );
}

export function ForbiddenPage() {
  return (
    <StatusView
      kind="forbidden"
      code="403"
      title="No access"
      description="You do not have permission to see this page. Ask an administrator if you need it."
      actions={<>{homeLink}<BackButton /></>}
    />
  );
}

/** For errorElement: whatever broke while loading or showing a page. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <StatusView
        fullScreen
        kind="notFound"
        code="404"
        title="Page not found"
        description="The address may be wrong, or the page was moved or deleted."
        actions={<a href={ROUTES.home} className={primary}><Home aria-hidden className="size-4" />Go to the start page</a>}
      />
    );
  }
  if (import.meta.env.DEV) console.error(error);
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  // A new version was deployed and an old page file is gone: a reload fixes it.
  const stale = error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error.message);
  return (
    <StatusView
      fullScreen
      kind={offline ? 'offline' : 'error'}
      code={offline ? undefined : isRouteErrorResponse(error) ? error.status : '500'}
      title={offline ? 'You are offline' : stale ? 'A new version is available' : 'Something went wrong'}
      description={
        offline
          ? 'Check your connection, then try again.'
          : stale
            ? 'Reload the page to get it.'
            : 'This page could not be shown. Try again; if it keeps happening, tell us what you did.'
      }
      actions={
        <>
          <Button leftIcon={RotateCw} onClick={() => location.reload()}>
            {stale ? 'Reload' : 'Try again'}
          </Button>
          <a href={ROUTES.home} className={outline}>
            Go to the start page
          </a>
        </>
      }
    />
  );
}
