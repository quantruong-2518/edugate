# OpenAPI codegen (pha 2 placeholder)

The FE consumes the NestJS API through generated TypeScript types. This is a
**placeholder** for pha 1 — the API and its OpenAPI spec do not exist yet.

## Pha 2 wiring

1. The NestJS app exports its OpenAPI document to `apps/web/openapi/schema.json`
   (e.g. `nest build && node dist/export-openapi.js`, or fetched from the
   running API: `curl http://localhost:3000/openapi.json -o openapi/schema.json`).
2. Generate types (types only — hooks stay hand-written, see
   `lib/api/queries.ts`):

   ```bash
   pnpm --filter web codegen:api
   ```

   This runs `openapi-typescript ./openapi/schema.json -o ./lib/api/generated/schema.d.ts`.
3. The data seam (`lib/api/admission.ts`, `forms.ts`, `landing.ts`) swaps its
   mock bodies for `http.<method>(...)` calls typed against the generated
   `schema.d.ts`. The TanStack Query hooks in `lib/api/queries.ts` and every UI
   call site stay unchanged — that is the point of the seam.

## Why types-only (not orval / full client gen)

We keep the axios client (`lib/api/http.ts`) and the Query hooks hand-written so
the network layer, tenant header and auth interceptors live in code we control
and comment. Codegen only owns the request/response **types**.
