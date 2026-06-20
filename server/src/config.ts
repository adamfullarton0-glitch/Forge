/**
 * Runtime configuration, read once from the environment. Throws on boot if a
 * required production secret is missing, so misconfiguration fails fast rather
 * than silently running insecurely.
 */
export interface Config {
  port: number;
  jwtSecret: string;
  /** Token lifetime in seconds. */
  jwtTtl: number;
  databaseUrl: string;
  /** Allowed browser origins for CORS (the PWA). '*' allows any. */
  corsOrigins: string[];
  bcryptRounds: number;
  isProd: boolean;
}

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const isProd = env.NODE_ENV === 'production';
  const jwtSecret = env.JWT_SECRET ?? '';
  if (isProd && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value (>= 32 chars) in production.');
  }
  const databaseUrl = env.DATABASE_URL ?? '';
  if (isProd && !databaseUrl) {
    throw new Error('DATABASE_URL must be set in production.');
  }
  const origins = (env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    port: num(env.PORT, 8080),
    jwtSecret: jwtSecret || 'dev-insecure-secret-change-me-please-0001',
    jwtTtl: num(env.JWT_TTL_SECONDS, 60 * 60 * 24 * 30), // 30 days
    databaseUrl,
    corsOrigins: origins.length ? origins : ['*'],
    bcryptRounds: num(env.BCRYPT_ROUNDS, 10),
    isProd,
  };
}
