-- 0017 — per-tenant deduplication on (student name + DOB).
--
-- Goal: one student cannot submit two live applications to the same school.
-- Across schools the same student is allowed (different tenant_id ⇒ different
-- (tenant_id, dedupe_key) tuple ⇒ no conflict).
--
-- The key is computed in the application service from
--     normalize(studentFullName) || '|' || normalize(dob)
-- where studentFullName resolves from applicant.studentFullName (NGT style)
-- or form_data.student.name / form_data.studentName (CVA/base style).
--
-- REJECTED / CANCELLED rows are excluded so a parent whose first submission
-- was rejected can submit again. Soft-deleted rows are also excluded so
-- admin retention work does not pin keys forever.
--
-- Rows with a NULL dedupe_key are not constrained — that covers tenants
-- whose flow can't produce a key (e.g. neither name nor DOB collected). Such
-- tenants opt out of dedup by virtue of not supplying the components.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS applications_tenant_dedupe_uniq
  ON applications (tenant_id, dedupe_key)
  WHERE deleted_at IS NULL
    AND dedupe_key IS NOT NULL
    AND state NOT IN ('REJECTED', 'CANCELLED');
