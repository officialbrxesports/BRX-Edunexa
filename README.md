# BRX EduNexa

BRX EduNexa is a multi-institution education management platform built as a TypeScript monorepo. Its architecture separates the web application, backend API, and shared engineering documentation.

## Technology Stack

* Web: Next.js 16, React 19, Tailwind CSS 4
* API: NestJS 11, TypeScript
* Database: PostgreSQL
* ORM: Prisma 7 with a PostgreSQL driver adapter
* Package management: npm workspaces

## Folder Structure

```text
BRX-EduNexa/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── docs/             # Architecture and engineering documentation
├── AGENTS.md         # Engineering and security rules
├── package.json      # Root workspace scripts
└── package-lock.json
```

## Prerequisites

Install Node.js 24 or newer, npm 11 or newer, and PostgreSQL access.

## Local Setup

Install dependencies from the repository root:

```powershell
npm install
```

Create the API environment file:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Create the web environment file:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

Replace example values with valid local configuration before using database, authentication, OAuth, or email features.

## Run Locally

Start the API in one terminal:

```powershell
npm run dev:api
```

Start the web application in another terminal:

```powershell
npm run dev:web
```

The API defaults to http://localhost:3000.
The web application defaults to http://localhost:3001.

## Build and Test

Run a workspace build:

```powershell
npm run build
```

Run workspace tests:

```powershell
npm test
```

Run lint checks:

```powershell
npm run lint
```

## Database Environments

Use separate Neon branches or separate PostgreSQL databases for development and testing. Configure `DATABASE_URL`, `DIRECT_URL`, and `TEST_DATABASE_URL` according to the project's Prisma configuration. Never run destructive tests against development or production data.

## Security

Never commit `.env`, `.env.local`, real credentials, access tokens, or production secrets. Commit example environment files containing placeholders only.

Review `AGENTS.md` and `docs/ARCHITECTURE.md` before implementing new features.
