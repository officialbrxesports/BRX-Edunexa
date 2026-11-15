# Deploying BRX EduNexa on a zero budget

Stack (all have a free tier): **Neon** (PostgreSQL) + **Render** (API) + **Vercel** (website).
Never commit real keys. Put them only in each service's "Environment" screen.

## 0. Know the free-tier limits first
- **Render free** sleeps after ~15 min idle. The first request after that takes ~30-60 s.
- **Render free has no permanent disk.** Admission documents saved on disk are lost on every restart/redeploy. Until file storage (Cloudflare R2 free 10 GB) is added, treat uploads as demo-only.
- **Vercel Hobby is for non-commercial use** and limits request bodies to ~4.5 MB (keep documents under 4 MB). When you start charging customers, move to a paid plan or another host.
- Neon free pauses when idle (wakes in about a second).

## 1. Database (Neon)
1. Create a project, copy the **direct** (non-pooled) connection string.
2. Local test of the same DB: put it in `apps/api/.env` as `DIRECT_URL`.
3. Create the tables: see "Baseline migration" below. Do NOT run `migrate deploy` on an empty DB before that is done.

## 2. API (Render, "Web Service")
- Repository: this GitHub repo. Root directory: repo root.
- Build command: `npm ci && npx prisma generate --schema apps/api/prisma/schema.prisma && npm run build --workspace @brx/api`
- Start command: confirm the built file first (`dir apps\api\dist`), then `node apps/api/dist/main.js`
- Environment: `NODE_ENV=production`, `DIRECT_URL`, `CORS_ORIGINS=https://<your-site>.vercel.app`, `TRUST_PROXY_HOPS=1`, `GOOGLE_CLIENT_ID`.
- Health check path: the API health endpoint (see `HealthModule`).

## 3. Website (Vercel)
- Root directory: `apps/web`. Framework: Next.js.
- Environment: `NEXT_PUBLIC_API_URL=/backend`, `API_BASE_URL=https://<your-api>.onrender.com`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Why `/backend`: the browser then talks to the same domain as the site, so the login cookie is first-party and works everywhere.

## 4. Baseline migration (needed once, before the first production deploy)
The repo only holds the newest migrations, so a brand-new database cannot be built from them alone.
Plan (done together, nothing is deleted without your OK):
1. Generate one SQL file for the whole current schema.
2. Replace the older migration folders with that single baseline.
3. On your local database mark the baseline as already applied (`prisma migrate resolve --applied ...`).
4. On Neon run `prisma migrate deploy`.

## 5. After deploying
- Create the first PLATFORM_ADMIN and approve institutions the same way as locally.
- Change every default password. Turn on 2FA for GitHub, Neon, Render and Vercel.
