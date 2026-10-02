import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/** Either driver behind one type; both expose the same query builder. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "db", "migrations");

/**
 * DATABASE_URL set (Docker, Supabase, Neon…) → real Postgres.
 * Otherwise → PGlite, an embedded Postgres stored in ./.pglite, so local dev needs nothing installed.
 * `memory: true` gives a throwaway database for tests.
 */
export function createDb(options: { url?: string; memory?: boolean } = {}) {
  const url = options.url ?? (options.memory ? undefined : process.env.DATABASE_URL);
  if (url) {
    const client = postgres(url, { max: 5 });
    const db = drizzlePostgres({ client, schema });
    return {
      db: db as unknown as Db,
      migrate: () => migratePostgres(db, { migrationsFolder: MIGRATIONS }),
      close: () => client.end(),
    };
  }
  const client = options.memory ? new PGlite() : new PGlite(process.env.PGLITE_DIR ?? path.join(process.cwd(), ".pglite"));
  const db = drizzlePglite({ client, schema });
  return {
    db: db as unknown as Db,
    migrate: () => migratePglite(db, { migrationsFolder: MIGRATIONS }),
    close: () => client.close(),
  };
}

// One connection per server process; kept on globalThis so dev hot reloads don't open new ones.
const shared = globalThis as unknown as { __db?: ReturnType<typeof createDb> };

export function getDb(): Db {
  shared.__db ??= createDb();
  return shared.__db.db;
}
