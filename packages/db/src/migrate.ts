import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { Pool } from "pg";

/**
 * Custom SQL migrator. Reads `./migrations/*.sql` in lexical order, runs each
 * pending file inside a transaction, and records the filename in a
 * `_migrations` ledger table. Chosen over drizzle-kit's journal format because
 * our migrations include things drizzle-kit doesn't model: Postgres roles,
 * RLS policies, EXCLUDE-USING-gist constraints, custom PL/pgSQL functions, and
 * raw seed data. Schema typings still come from src/schema/* — the SQL is the
 * authoritative DDL and TS mirrors it.
 *
 * Idempotent: re-running is a no-op once everything is applied.
 */
async function main(): Promise<void> {
  const url =
    process.env["DATABASE_URL_MAINTENANCE"] ?? process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "DATABASE_URL_MAINTENANCE (or DATABASE_URL) is required to run migrations.",
    );
  }

  const migrationsDir = resolve(
    process.env["MIGRATIONS_DIR"] ?? "./migrations",
  );

  const pool = new Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name        TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set<string>(
      (await client.query<{ name: string }>("SELECT name FROM _migrations")).rows.map(
        (r) => r.name,
      ),
    );

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      // eslint-disable-next-line no-console
      console.log(`[migrate] applying ${file} …`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations(name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        count += 1;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(
          `Migration ${file} failed: ${(err as Error).message}`,
          { cause: err },
        );
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      count > 0
        ? `[migrate] applied ${count} migration(s).`
        : "[migrate] up to date.",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[migrate]", err);
  process.exit(1);
});
