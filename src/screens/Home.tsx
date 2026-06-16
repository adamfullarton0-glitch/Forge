import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

/**
 * Renders only when `crash` is true — used to prove the per-screen error
 * boundary contains a failure without blanking the app. This is a deliberate,
 * test-covered diagnostic, not dead code.
 */
function CrashOnRender({ crash }: { crash: boolean }): JSX.Element {
  if (crash) {
    throw new Error('Deliberate Home-screen error (error-boundary proof).');
  }
  return <span className="state__msg">Diagnostics nominal.</span>;
}

export function Home(): JSX.Element {
  const [crash, setCrash] = useState(false);

  return (
    <div className="screen">
      <span className="pulse-header">Home</span>
      <h1 className="screen__title">Forge yourself.</h1>
      <p className="screen__lede">Train, eat and recover — one premium system.</p>

      <div className="stack">
        <Card>
          <span className="pulse-header">Coach insight</span>
          <p style={{ margin: '12px 0 0', lineHeight: 1.5 }}>
            Welcome to FORGE. This is the Phase&nbsp;1 scaffold — type-safe, installable and
            offline-ready. Real dashboards land in Phase&nbsp;4.
          </p>
        </Card>

        <Card>
          <span className="pulse-header">Today</span>
          <div
            style={{
              display: 'flex',
              gap: 18,
              marginTop: 14,
              alignItems: 'baseline',
            }}
          >
            <span className="pulse-stat" style={{ fontSize: '2.4rem' }}>
              0
            </span>
            <span className="state__msg">sessions logged</span>
          </div>
        </Card>

        <Card>
          <span className="pulse-header">Diagnostics</span>
          <p style={{ margin: '12px 0 14px', lineHeight: 1.5 }}>
            Prove the safety net: this throws inside the Home screen. The boundary catches it, the
            bottom nav survives, and every other screen keeps working.
          </p>
          <Button variant="danger" onClick={() => setCrash(true)}>
            <Icon name="alert" size={18} /> Trigger screen error
          </Button>
          <div style={{ marginTop: 14 }}>
            <CrashOnRender crash={crash} />
          </div>
        </Card>
      </div>
    </div>
  );
}
