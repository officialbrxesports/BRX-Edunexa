# BRX EduNexa — Agent and Engineering Rules

## Scope
- Build only what the current task requests.
- Do not restore, import, or copy old project code from Git.
- Do not create backups unless explicitly requested.
- Never modify or delete existing files under `apps/web/public`.
- Do not create `apps/mobile` until explicitly requested.
- Do not modify unrelated files.

## Architecture
- Root npm workspaces: `apps/*`.
- API: NestJS 11, strict TypeScript, port 3000.
- Web: Next.js 16 App Router, React 19, Tailwind CSS 4, strict TypeScript, port 3001.
- All web application source belongs under `apps/web/src`.
- Use Prisma 7 with its current configuration conventions and a PostgreSQL driver adapter.
- Verify installed package versions and official documentation before relying on version-specific APIs.

## Security and tenant isolation
Every authenticated API request must establish:
1. WHO: valid JWT, a live session, an ACTIVE user, and an ACTIVE institution where applicable.
2. WHAT: role and feature permission.
3. WHICH institution: derive `institutionId` only from authenticated identity, never from request body, query, headers, or URL.

- Every tenant-scoped database query must include the authenticated `institutionId`.
- Tenant-scoped services receive an `AuthContext` containing `userId`, `role`, and a non-null `institutionId`.
- Only `PLATFORM_ADMIN` may have a null institution ID, and only platform endpoints may use that identity.
- Return the same 404 response for another tenant's data and nonexistent data.
- Hash passwords with Argon2. Never return or log password hashes.
- Password reset must use an emailed reset link.
- Store token and OTP hashes, not plaintext secrets.
- Authentication tokens belong in HttpOnly cookies set through Next.js route handlers.
- Never store tokens or user data in localStorage or sessionStorage.
- Validate DTOs with class-validator, whitelist enabled, and non-whitelisted fields forbidden.
- Rate-limit public and sensitive endpoints.
- Remove personal information from responses when the viewer is not authorized to see it.
- Record sensitive actions as audit events without secrets.
- Never return `passwordHash`, `tokenHash`, or `codeHash`.

## IDs
- Institution-defined user IDs use a three-uppercase-letter prefix followed by nine random digits.
- Generate random digits using Node.js cryptographic randomness.
- IDs must be unique, permanent, and never reused.
- Enforce uniqueness in the database and handle collisions safely.

## Code quality
- TypeScript strict mode; do not use `any`.
- Keep each source file at or below 400 lines.
- One clear responsibility per file.
- No dead code, TODO placeholders, or commented-out code.
- Search for existing utilities before adding duplicates.
- Keep UI text in `apps/web/src/lib/i18n/en.ts`; Hindi translations can be added later.
- Use small, focused UI components.

## API and testing
- Every new endpoint must have at least one test.
- Use global DTO validation with whitelist, forbidNonWhitelisted, and transform enabled.
- Configure Helmet and CORS from validated environment variables.
- Support graceful shutdown.
- Keep `GET /health` public and return `{ "status": "ok" }`.

## Environment and secrets
- Commit example environment files containing placeholders only.
- Never invent real credentials or print secret `.env` values.
- Fail application startup when required environment variables are missing or invalid.
- Never commit real environment files.

## Workflow
- Make changes in small, verifiable steps.
- Explain which files changed after each step.
- Review Prisma schema changes before applying migrations.
- Run build and tests before claiming completion.
- Report commands that were run and their actual results.
