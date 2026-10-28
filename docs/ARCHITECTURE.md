# BRX EduNexa — Architecture

## 1. Monorepo Layout

BRX EduNexa uses npm workspaces to maintain independent applications in one repository.

* `apps/web`: Next.js App Router frontend, React UI, and server-side route handlers.
* `apps/api`: NestJS REST API, guards, controllers, services, and backend modules.
* `docs`: Architecture and engineering documentation.
* `AGENTS.md`: Repository-wide engineering, security, and workflow requirements.

The web application uses port 3001 by default. The API uses port 3000.

## 2. Request and Authentication Flow

1. The browser sends requests to the Next.js application.
2. Next.js route handlers manage authentication cookies and forward authorized requests to the NestJS API when required.
3. The API validates the request through authentication and authorization guards.
4. Authentication establishes the user identity, live session, active account status, and institution context where applicable.
5. Authorization checks the user's role and feature permissions.
6. Controllers pass validated input and authenticated context to services.
7. Services perform database operations through Prisma, applying institution scope to every tenant-scoped query.
8. Responses contain only information the authenticated viewer is authorized to access.

Authentication tokens must use HttpOnly cookies. Do not store tokens or user data in localStorage or sessionStorage.

## 3. Tenant Isolation

Institution isolation is mandatory.

* Derive `institutionId` exclusively from the authenticated identity.
* Never trust `institutionId` from request bodies, query parameters, headers, or URLs.
* Tenant-scoped services receive an `AuthContext` containing `userId`, `role`, and a non-null `institutionId`.
* Only `PLATFORM_ADMIN` may have a null institution ID, and that identity may be used only by platform endpoints.
* Every tenant-scoped database query must include the authenticated institution scope.
* Return the same 404 response for another institution's inaccessible resource and a nonexistent resource.
* Verify user and institution status before authorizing protected requests.

## 4. Identifier Rules

Institution-defined user IDs consist of exactly 12 characters:

* Three uppercase alphabetic prefix characters.
* Nine cryptographically generated random digits.

IDs must be unique, permanent, and never reused. Enforce uniqueness in the database and handle collisions safely.

## 5. Security Requirements

* Hash passwords using Argon2.
* Store token and OTP hashes rather than plaintext secrets.
* Never expose password hashes, token hashes, or code hashes.
* Password resets use emailed reset links.
* Validate request DTOs with whitelist enabled, non-whitelisted properties forbidden, and transformation enabled.
* Configure Helmet, CORS, and rate limiting appropriately.
* Validate required environment variables at application startup.
* Record sensitive actions as audit events without recording secrets.
* Restrict personal information in API responses according to authorization.

## 6. Domain Module Map

The following is the intended domain module map, not a claim that every module is already implemented.

* Health: public application health endpoint.
* Authentication and sessions: login, identity verification, and session lifecycle.
* Institutions: institution records and status.
* Users and roles: account management and role permissions.
* Platform administration: platform-level operations.
* Students and teachers: education personnel records.
* Academics: classes, subjects, and academic organization.
* Attendance: attendance records and related workflows.
* Fees: fee structures, payments, and balances.
* Notifications and email: delivery workflows.
* Audit: records of sensitive administrative actions.

New modules must follow the repository's existing conventions, include tests, and enforce authentication and institution isolation where applicable.
