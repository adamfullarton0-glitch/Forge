/**
 * Part C.4 platform layer — the typed swap-points for everything that needs a
 * backend or native shell: accounts, cross-device sync, push notifications,
 * billing (store / IAP) and ads.
 *
 * This client ships with *local stub* implementations only (see ./local). They
 * report their capabilities honestly and never throw, so the UI degrades
 * gracefully. A real backend/native build swaps the implementations in via the
 * `platform` registry (./index) without touching any screen — exactly the
 * pattern used by `DeviceSleepAdapter`.
 */

/** Why a platform capability isn't available right now. */
export type PlatformReason = 'stubbed' | 'unsupported' | 'denied' | 'offline' | 'error';

/** A typed result that can never throw at the call site. */
export type PlatformResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: PlatformReason; error: string };

export const ok = <T>(value: T): PlatformResult<T> => ({ ok: true, value });
export const fail = <T>(reason: PlatformReason, error: string): PlatformResult<T> => ({
  ok: false,
  reason,
  error,
});

/* ----------------------------- Accounts ----------------------------- */

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  /** True for the on-device local identity (no real account). */
  anonymous: boolean;
}

export interface AuthAdapter {
  readonly kind: 'local' | 'remote';
  readonly label: string;
  /** The signed-in user, or the anonymous local identity. Never null. */
  currentUser(): AuthUser;
  signIn(email: string, password: string): Promise<PlatformResult<AuthUser>>;
  signOut(): Promise<PlatformResult<null>>;
}

/* ------------------------------- Sync ------------------------------- */

export type SyncState = 'off' | 'idle' | 'syncing' | 'error';

export interface SyncStatus {
  state: SyncState;
  /** ISO timestamp of the last successful sync, or null. */
  lastSync: string | null;
  detail: string;
}

export interface SyncAdapter {
  readonly enabled: boolean;
  status(): SyncStatus;
  push(): Promise<PlatformResult<null>>;
  pull(): Promise<PlatformResult<null>>;
}

/* ----------------------------- Push ----------------------------- */

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushReminder {
  id: string;
  title: string;
  body: string;
  /** ISO time to fire. */
  at: string;
}

export interface PushAdapter {
  readonly channel: 'local' | 'remote';
  permission(): PushPermission;
  requestPermission(): Promise<PlatformResult<PushPermission>>;
  schedule(reminder: PushReminder): PlatformResult<null>;
}

/* ----------------------------- Billing ----------------------------- */

export interface Product {
  id: string;
  name: string;
  price: string;
  period: 'month' | 'year' | 'once';
}

export interface BillingAdapter {
  readonly storeAvailable: boolean;
  products(): readonly Product[];
  /** Resolves with the purchased product id on success. */
  purchase(id: string): Promise<PlatformResult<string>>;
  /** Resolves with the restored product ids. */
  restore(): Promise<PlatformResult<readonly string[]>>;
}

/* ------------------------------- Ads ------------------------------- */

export interface AdsAdapter {
  readonly enabled: boolean;
  /** Whether an ad slot should render (never for PRO users). */
  shouldShow(pro: boolean): boolean;
}

/* ----------------------------- Registry ----------------------------- */

export interface Platform {
  auth: AuthAdapter;
  sync: SyncAdapter;
  push: PushAdapter;
  billing: BillingAdapter;
  ads: AdsAdapter;
  /** True while every capability is a local stub (no backend wired yet). */
  readonly stubbed: boolean;
}
