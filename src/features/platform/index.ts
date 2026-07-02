/**
 * THE single swap-point for the Part C.4 backend/native capabilities. Today
 * every adapter is a local stub; a real build reassigns these to backed
 * implementations (Firebase/Supabase auth + sync, web-push, StoreKit/Play
 * Billing, an ad SDK) with no changes required in any screen.
 */
import {
  localAdsAdapter,
  localAuthAdapter,
  localBillingAdapter,
  localPushAdapter,
  localSyncAdapter,
} from './local';
import type { Platform } from './types';

export const platform: Platform = {
  auth: localAuthAdapter,
  sync: localSyncAdapter,
  push: localPushAdapter,
  billing: localBillingAdapter,
  ads: localAdsAdapter,
  stubbed: true,
};

export * from './types';
