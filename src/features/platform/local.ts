/**
 * Local stub implementations of the platform adapters. They are honest about
 * what they can't do (no backend = no accounts/sync/push/IAP) and never throw.
 * Real implementations replace these in `./index` when a backend/native shell
 * is added.
 */
import {
  fail,
  ok,
  type AdsAdapter,
  type AuthAdapter,
  type AuthUser,
  type BillingAdapter,
  type Product,
  type PushAdapter,
  type PushPermission,
  type SyncAdapter,
} from './types';

const NEEDS_BACKEND = 'Accounts, sync and notifications arrive with the FORGE backend.';

/** The on-device identity used until real accounts exist. */
const LOCAL_USER: AuthUser = {
  id: 'local',
  name: 'This device',
  email: null,
  anonymous: true,
};

export const localAuthAdapter: AuthAdapter = {
  kind: 'local',
  label: 'On-device',
  currentUser: () => LOCAL_USER,
  signIn: () => Promise.resolve(fail('stubbed', NEEDS_BACKEND)),
  signOut: () => Promise.resolve(ok(null)),
};

export const localSyncAdapter: SyncAdapter = {
  enabled: false,
  status: () => ({
    state: 'off',
    lastSync: null,
    detail: 'This device only — export a backup from Settings to move your data.',
  }),
  push: () => Promise.resolve(fail('stubbed', NEEDS_BACKEND)),
  pull: () => Promise.resolve(fail('stubbed', NEEDS_BACKEND)),
};

/** Reads the browser's notification permission without requesting it. */
function browserPermission(): PushPermission {
  try {
    if (typeof Notification === 'undefined') return 'unsupported';
    const p = Notification.permission;
    return p === 'granted' || p === 'denied' ? p : 'default';
  } catch {
    return 'unsupported';
  }
}

export const localPushAdapter: PushAdapter = {
  channel: 'local',
  permission: browserPermission,
  // Real scheduled push needs a service-worker push subscription + backend.
  requestPermission: () => Promise.resolve(fail('stubbed', NEEDS_BACKEND)),
  schedule: () => fail('stubbed', NEEDS_BACKEND),
};

/** The PRO catalogue (display prices for the demo store). */
const PRODUCTS: readonly Product[] = [
  { id: 'pro.monthly', name: 'FORGE PRO — Monthly', price: '£4.99', period: 'month' },
  { id: 'pro.yearly', name: 'FORGE PRO — Yearly', price: '£39.99', period: 'year' },
  { id: 'pro.lifetime', name: 'FORGE PRO — Lifetime', price: '£89.99', period: 'once' },
];

export const localBillingAdapter: BillingAdapter = {
  storeAvailable: false,
  products: () => PRODUCTS,
  // The demo activates PRO directly via the store; real IAP needs the store SDK.
  purchase: () =>
    Promise.resolve(fail('stubbed', 'In-app purchases require the App Store / Play build.')),
  restore: () =>
    Promise.resolve(fail('stubbed', 'Purchase restore requires the App Store / Play build.')),
};

export const localAdsAdapter: AdsAdapter = {
  enabled: false,
  // No ads in this build; a real ad SDK would gate on `pro` here.
  shouldShow: () => false,
};
