import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFound() {
  return (
    <EmptyState icon={Compass} title="Page not found" action={<Link to="/" className="btn-primary">Go to dashboard</Link>}>
      That address does not match any page in CloudQuest.
    </EmptyState>
  );
}
