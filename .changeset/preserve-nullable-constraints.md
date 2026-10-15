---
"@fohoov/zod-openapi-client": minor
---

fix: keep validations on nullable fields in generated zod schemas. `anyOf`/`oneOf` of one inline schema plus `null` (e.g. FastAPI's `str | None`) is now generated as `z.string().min(..).max(..).nullable()` instead of `z.union([z.string(), z.null()])`. Generated schemas get stricter (lengths, `.int()`, `.datetime()`, patterns) wherever the spec declares them.

chore: upgrade the CLI's own zod to v4; `--skip-spec-validations false` and `--overwrite-existing-operation-ids false` now mean false (they were coerced to `true` before). Remove the unused `ts-to-zod` dependency.
