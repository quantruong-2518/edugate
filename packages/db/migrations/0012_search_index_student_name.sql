-- Extend the applications search GIN index so it also covers:
--   • applicant.studentFullName  — collected by tenants that ask for the
--     student's name up-front on the wizard's applicant step (e.g. NGT).
--   • form_data.student.name     — the resolved student record from the
--     studentLookup field (the actual key under `form_data` is `student`,
--     not `studentName` as the original index assumed).
-- Index recreation is idempotent (DROP IF EXISTS + CREATE) and touches no
-- data; it briefly takes an ACCESS EXCLUSIVE lock on `applications` while
-- the new index builds. For a fleet at production scale switch to
-- `CREATE INDEX CONCURRENTLY` — kept inline here since pha 1 / pha 2 early
-- volume is low and the migration runner doesn't autocommit per statement.

DROP INDEX IF EXISTS applications_search_idx;

CREATE INDEX applications_search_idx
  ON applications USING gin(
    to_tsvector('simple',
      immutable_unaccent(
        coalesce(applicant->>'fullName', '')          || ' ' ||
        coalesce(applicant->>'studentFullName', '')   || ' ' ||
        coalesce(form_data->>'studentName', '')       || ' ' ||
        coalesce(form_data->'student'->>'name', '')
      )
    )
  )
  WHERE deleted_at IS NULL;
