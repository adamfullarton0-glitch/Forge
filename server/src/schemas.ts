import { z } from 'zod';

/** Registration enforces a minimum password strength. */
export const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});
export type Credentials = z.infer<typeof CredentialsSchema>;

/**
 * Login validates shape only (valid email + a non-empty password). It must NOT
 * enforce password rules — a generic 401 is returned for any mismatch so we
 * never leak whether an account exists or why a password failed.
 */
export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

/**
 * A sync push. `data` is the client's full app-state blob (validated/normalised
 * on the client by its Zod schema), opaque here but size-bounded. `baseRev` is
 * the revision the client last saw, for optimistic concurrency.
 */
export const SyncPutSchema = z.object({
  data: z.unknown(),
  baseRev: z.number().int().nonnegative().catch(0),
});
export type SyncPut = z.infer<typeof SyncPutSchema>;
