---
"@fohoov/zod-openapi-client": patch
---

fix: removed cwd for openapi tools because spec file would be resolved relative to node_modules not consumers cwd
