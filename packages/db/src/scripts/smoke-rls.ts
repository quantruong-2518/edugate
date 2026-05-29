import { Pool } from "pg";

/**
 * Validates the multi-tenant isolation bet from specs/THREAT_MODEL.md §5.
 *
 * Setup: the dev seed (0009) creates two tenants — cva-edu and tran-dai-nghia —
 * each with a campaign and form template.  We insert one application into
 * each tenant as the maintenance role (BYPASSRLS).  Then, switching to
 * app_role with `app.tenant_id` pinned to one tenant, we assert:
 *
 *   1. SELECT without filter returns ONLY this tenant's row.
 *   2. SELECT with no app.tenant_id set throws (the alarm).
 *   3. INSERT with the wrong tenant_id is rejected (WITH CHECK).
 *
 * Exits non-zero on any failure so it can wedge CI.
 */

type Pair = { tenantA: string; tenantB: string };

async function lookupTenants(pool: Pool): Promise<Pair> {
  const { rows } = await pool.query<{ id: string; code: string }>(
    `SELECT id, code FROM tenants WHERE code IN ('cva-edu','tran-dai-nghia')`,
  );
  const a = rows.find((r) => r.code === "cva-edu");
  const b = rows.find((r) => r.code === "tran-dai-nghia");
  if (!a || !b) {
    throw new Error(
      "Expected cva-edu + tran-dai-nghia seeded. Run pnpm db:migrate first.",
    );
  }
  return { tenantA: a.id, tenantB: b.id };
}

async function seedOneApp(pool: Pool, tenantId: string, name: string): Promise<void> {
  const { rows } = await pool.query<{ id: string; version: number }>(
    `SELECT id, version FROM form_templates
      WHERE tenant_id = $1 AND code = 'lop6-2026' AND version = 1`,
    [tenantId],
  );
  const ft = rows[0];
  if (!ft) throw new Error(`No form template for tenant ${tenantId}`);
  const { rows: cRows } = await pool.query<{ id: string }>(
    `SELECT id FROM admission_campaigns
      WHERE tenant_id = $1 AND code = 'intake-2026'`,
    [tenantId],
  );
  const cid = cRows[0]?.id;
  if (!cid) throw new Error(`No campaign for tenant ${tenantId}`);

  await pool.query(
    `INSERT INTO applications
       (tenant_id, campaign_id, code, state, applicant, form_data,
        form_template_id, form_template_version, submitted_at)
     VALUES ($1, $2, $3, 'SUBMITTED', $4, $5, $6, $7, now())
     ON CONFLICT (tenant_id, code) DO NOTHING`,
    [
      tenantId,
      cid,
      `${name}-CODE`,
      JSON.stringify({
        fullName: "Phụ huynh " + name,
        email: `${name}@test.local`,
        phone: "0900000000",
        relationship: "father",
      }),
      JSON.stringify({ studentName: name, gpa: 9.1 }),
      ft.id,
      ft.version,
    ],
  );
}

function assertEq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  expected: ${expected}\n  actual:   ${actual}`);
  }
}

async function main(): Promise<void> {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL required.");

  const pool = new Pool({ connectionString: url, max: 2 });
  const { tenantA, tenantB } = await lookupTenants(pool);

  // Maintenance-role inserts: one application per tenant.
  await seedOneApp(pool, tenantA, "Alice");
  await seedOneApp(pool, tenantB, "Bob");

  // --- Test 1: SET ROLE app_role + app.tenant_id pinned to A → only A's row.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE app_role");
    await client.query(`SET LOCAL app.tenant_id = '${tenantA}'`);
    const { rows } = await client.query<{ tenant_id: string }>(
      "SELECT tenant_id FROM applications",
    );
    assertEq(rows.length, 1, "[Test 1] expected exactly 1 row visible to tenant A");
    assertEq(
      rows[0]?.tenant_id,
      tenantA,
      "[Test 1] visible row must belong to tenant A",
    );
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
  // eslint-disable-next-line no-console
  console.log("[smoke-rls] ✓ Test 1: app_role pinned to A sees only A's row");

  // --- Test 2: SET ROLE app_role without app.tenant_id → throws.
  const c2 = await pool.connect();
  try {
    await c2.query("BEGIN");
    await c2.query("SET LOCAL ROLE app_role");
    let threw = false;
    try {
      await c2.query("SELECT 1 FROM applications");
    } catch (err) {
      threw = true;
      const msg = (err as Error).message;
      if (!msg.toLowerCase().includes("app.tenant_id")) {
        throw new Error(
          `[Test 2] threw, but not on missing app.tenant_id: ${msg}`,
        );
      }
    }
    if (!threw) {
      throw new Error("[Test 2] expected a throw when app.tenant_id is unset");
    }
    // The exception aborts the tx; ROLLBACK to clean.
    try {
      await c2.query("ROLLBACK");
    } catch {
      /* tx already aborted */
    }
  } finally {
    c2.release();
  }
  // eslint-disable-next-line no-console
  console.log(
    "[smoke-rls] ✓ Test 2: app_role without app.tenant_id throws (the alarm)",
  );

  // --- Test 3: INSERT with wrong tenant_id rejected by WITH CHECK.
  const c3 = await pool.connect();
  try {
    await c3.query("BEGIN");
    await c3.query("SET LOCAL ROLE app_role");
    await c3.query(`SET LOCAL app.tenant_id = '${tenantA}'`);
    // Look up tenant A's campaign and form template inside the same tx.
    const { rows: ftRows } = await c3.query<{ id: string; version: number }>(
      `SELECT id, version FROM form_templates WHERE tenant_id = $1`,
      [tenantA],
    );
    const { rows: cRows } = await c3.query<{ id: string }>(
      `SELECT id FROM admission_campaigns WHERE tenant_id = $1`,
      [tenantA],
    );
    const ft = ftRows[0];
    const cid = cRows[0]?.id;
    if (!ft || !cid) throw new Error("[Test 3] setup failed");

    let threw = false;
    try {
      await c3.query(
        `INSERT INTO applications
          (tenant_id, campaign_id, code, state, applicant, form_data,
           form_template_id, form_template_version, submitted_at)
         VALUES ($1, $2, 'X-SPOOF', 'SUBMITTED', '{}'::jsonb, '{}'::jsonb,
                 $3, $4, now())`,
        [tenantB, cid, ft.id, ft.version],
      );
    } catch (err) {
      threw = true;
      const msg = (err as Error).message;
      if (!msg.includes("row-level security") && !msg.includes("violates")) {
        throw new Error(`[Test 3] threw, but not on RLS: ${msg}`);
      }
    }
    if (!threw) {
      throw new Error(
        "[Test 3] expected a throw when inserting with foreign tenant_id",
      );
    }
    await c3.query("ROLLBACK");
  } finally {
    c3.release();
  }
  // eslint-disable-next-line no-console
  console.log("[smoke-rls] ✓ Test 3: cross-tenant INSERT rejected by WITH CHECK");

  await pool.end();
  // eslint-disable-next-line no-console
  console.log("\n[smoke-rls] all checks passed.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[smoke-rls] FAILED:", err);
  process.exit(1);
});
