// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export const PORT = process.env.PORT || 3000;
export const TRUST_PROXY = process.env.TRUST_PROXY || 1;
export const AUTHORIZATION = process.env.AUTHORIZATION || '';

// Postgres Database URL (connection string)
export const DATABASE_URL = process.env.DATABASE_URL ?? '';
// Database SSL
export const DATABASE_USE_SSL =
  Number(process.env.DATABASE_USE_SSL ?? '0') || 0;
// Migrate DB programatically
export const MIGRATE_DB_PROGRAMATICALLY =
  Number(process.env.MIGRATE_DB_PROGRAMATICALLY ?? '0') || 0;

export const SENTRY_DSN = process.env.SENTRY_DSN ?? '';
