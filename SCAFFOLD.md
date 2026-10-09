# TEMPORARY SCAFFOLD

This repository was completely empty when starting work on branch `feature/m2-health-assessment`.
To allow Module M2 ("Health Assessment & Medical History") to execute, compile, test, and run locally, minimal temporary scaffold files were added.
When the shared team scaffold is merged, these root configuration files can be replaced by the official team scaffold.

### Temporary Root Scaffold Files
- `package.json` - Pinned dependencies and scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- `package-lock.json` - Dependency lockfile.
- `tsconfig.json` - Strict TypeScript configuration.
- `next.config.ts` - Minimal Next.js configuration.
- `vitest.config.ts` - Minimal Vitest test runner configuration.
- `vitest.setup.ts` - Test setup file for jest-dom and jest-axe.
- `.eslintrc.json` - Minimal ESLint configuration extending `next/core-web-vitals`.
- `.gitignore` - Standard Git ignore rules for Next.js, Node, and environment files.
- `.env.example` - Example environment variables for Supabase and speech fallback.
- `docs/assumed_schema.sql` - Read-only reference DDL describing the database constraints defined by the project.

All actual M2 logic is strictly encapsulated within:
- `modules/patient_intake/`
- `app/intake/` (thin route wrapper)
- `app/api/v1/triage/assess/` (thin route handler wrapper)
