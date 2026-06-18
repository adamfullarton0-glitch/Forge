import { describe, it, expect } from 'vitest';
import { platform } from './index';

describe('platform registry', () => {
  it('is fully stubbed (no backend wired)', () => {
    expect(platform.stubbed).toBe(true);
  });
});

describe('auth (local)', () => {
  it('exposes a stable anonymous on-device identity', () => {
    const u = platform.auth.currentUser();
    expect(u.anonymous).toBe(true);
    expect(u.id).toBe('local');
    expect(u.email).toBeNull();
  });

  it('reports sign-in as needing a backend, and sign-out as a no-op success', async () => {
    const inRes = await platform.auth.signIn('a@b.com', 'pw');
    expect(inRes.ok).toBe(false);
    if (!inRes.ok) expect(inRes.reason).toBe('stubbed');
    expect((await platform.auth.signOut()).ok).toBe(true);
  });
});

describe('sync (local)', () => {
  it('is off and explains how to move data', () => {
    expect(platform.sync.enabled).toBe(false);
    expect(platform.sync.status().state).toBe('off');
    expect(platform.sync.status().detail.length).toBeGreaterThan(0);
  });

  it('push/pull resolve to a stubbed failure rather than throwing', async () => {
    expect((await platform.sync.push()).ok).toBe(false);
    expect((await platform.sync.pull()).ok).toBe(false);
  });
});

describe('push (local)', () => {
  it('returns a valid permission state', () => {
    expect(['default', 'granted', 'denied', 'unsupported']).toContain(platform.push.permission());
  });

  it('cannot schedule real notifications without a backend', async () => {
    expect(platform.push.schedule({ id: '1', title: 't', body: 'b', at: '2026-01-01' }).ok).toBe(
      false,
    );
    expect((await platform.push.requestPermission()).ok).toBe(false);
  });
});

describe('billing (local)', () => {
  it('lists products but cannot transact without a store', async () => {
    expect(platform.billing.storeAvailable).toBe(false);
    expect(platform.billing.products().length).toBeGreaterThan(0);
    const buy = await platform.billing.purchase('pro.monthly');
    expect(buy.ok).toBe(false);
    expect((await platform.billing.restore()).ok).toBe(false);
  });
});

describe('ads (local)', () => {
  it('is disabled for everyone in this build', () => {
    expect(platform.ads.enabled).toBe(false);
    expect(platform.ads.shouldShow(false)).toBe(false);
    expect(platform.ads.shouldShow(true)).toBe(false);
  });
});
