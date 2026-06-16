/**
 * A screen that always throws on render. Not in the nav — it exists only to
 * prove (in tests + e2e) that the per-route error boundary contains a crash
 * while the nav and other screens keep working.
 */
export function Boom(): JSX.Element {
  throw new Error('Deliberate screen error (error-boundary proof).');
}
