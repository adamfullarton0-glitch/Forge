import { Card } from '@/components/Card';
import { EmptyState } from '@/components/states';
import { type IconName } from '@/components/Icon';

interface PlaceholderProps {
  title: string;
  icon: IconName;
  note: string;
}

/**
 * A typed, accessible stand-in for screens that arrive in later build phases.
 * Keeps the nav fully navigable while only Home + Train are fleshed out.
 */
export function Placeholder({ title, icon, note }: PlaceholderProps): JSX.Element {
  return (
    <div className="screen">
      <span className="pulse-header">{title}</span>
      <h1 className="screen__title">{title}</h1>
      <p className="screen__lede">Coming in a later build phase.</p>
      <Card>
        <EmptyState title={`${title} is on the roadmap`} message={note} icon={icon} />
      </Card>
    </div>
  );
}
