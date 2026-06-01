-- 0024 — per-tenant unique student code (mã học sinh).
--
-- Tenants whose form collects `studentCode` (NGT, NHT, NVH, default) require
-- each student code to be unique inside one tenant: two families cannot reuse
-- the same school-issued ID. Across tenants the same string is allowed —
-- different (tenant_id, code) tuple.
--
-- Comparison is case-insensitive via upper() so "HS001" and "hs001" collide.
-- The expression is in the index so the planner can use it for both the
-- uniqueness check and any future lookup query.
--
-- Scope mirrors `applications_tenant_dedupe_uniq` (migration 0017):
--   • soft-deleted rows excluded (admin retention work doesn't pin codes)
--   • REJECTED / CANCELLED excluded (parent can re-submit after rejection)
--   • NULL / empty studentCode excluded (tenants without the field opt out)

CREATE UNIQUE INDEX IF NOT EXISTS applications_tenant_student_code_uniq
  ON applications (tenant_id, (upper(form_data->>'studentCode')))
  WHERE deleted_at IS NULL
    AND (form_data->>'studentCode') IS NOT NULL
    AND (form_data->>'studentCode') <> ''
    AND state NOT IN ('REJECTED', 'CANCELLED');
