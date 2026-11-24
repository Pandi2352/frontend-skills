import { FileQuestion, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/shared/states';
import { ROUTES } from '@/config/routes';

const home = (
  <Link to={ROUTES.home} className="rounded-md text-primary underline focus-visible:outline-2 focus-visible:outline-focus">
    Go to the start page
  </Link>
);

export function NotFoundPage() {
  return <EmptyState icon={FileQuestion} title="Page not found" description="The address may be wrong, or the page was moved." action={home} />;
}

export function ForbiddenPage() {
  return <EmptyState icon={Lock} title="No access" description="You do not have permission to see this page." action={home} />;
}
