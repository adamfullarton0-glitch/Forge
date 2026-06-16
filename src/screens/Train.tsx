import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/states';

export function Train(): JSX.Element {
  return (
    <div className="screen">
      <span className="pulse-header">Train</span>
      <h1 className="screen__title">Your training.</h1>
      <p className="screen__lede">Plans, exercises and active workouts arrive in Phase&nbsp;5.</p>

      <div className="stack">
        <Card>
          <span className="pulse-header">Focus</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <Chip label="Push" active />
            <Chip label="Pull" />
            <Chip label="Legs" />
            <Chip label="Full body" />
          </div>
        </Card>

        <Card>
          <EmptyState
            title="No workouts yet"
            message="Exercise library and workout plans will be ported from the prototype in Phase 5."
            icon="train"
          />
        </Card>
      </div>
    </div>
  );
}
