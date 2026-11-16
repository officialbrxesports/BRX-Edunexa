# Deploying BRX EduNexa on a zero budget

Stack (all have a free tier): **Neon** (PostgreSQL) + **Render** (API) + **Vercel** (website).
Never commit real keys. Put them only in each service's "Environment" screen.

## 0. Know the free-tier limits first
- **Render free** sleeps after ~15 min idle. The first request after that takes ~30-60 s.
- **Render free has no permanent disk.** Admission documents saved on disk are lost on every restart/redeploy. Until file storage (Cloudflare R2 free 10 GB) is added, treat uploads as demo-only.
- **Vercel Hobby is for non-commercial use** and limits request bodies to ~4.5 MB. When you start charging customers, move to a paid plan or another host.
- Neon free pauses when idle (wakes in about a second).

## 1. Database (Neon)
1. Create a project and copy the **direct** (non-pooled) connection string (`postgresql://...`). Keep it secret.
2. Do not create tables by hand. The API creates them on start (`prisma migrate deploy`).

## 2. API (Render)
1. New > **Blueprint**, pick this GitHub repo. Render reads `render.yaml`.
2. When asked, fill the three secret values:
   - `DIRECT_URL` = the Neon connection string
   - `CORS_ORIGINS` = your Vercel address, for example `https://your-app.vercel.app` (add it after step 3 if you do not know it yet)
   - `GOOGLE_CLIENT_ID` = your Google client id, or leave it empty if you do not use Google sign-in
3. Wait for the first deploy. Open `https://<your-api>.onrender.com/health`: it must show `{"status":"ok"}`.

## 3. Website (Vercel)
1. Add New > Project, pick this repo. **Root Directory: `apps/web`**. Framework: Next.js.
2. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `/backend`
   - `API_BASE_URL` = `https://<your-api>.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = same Google client id (optional)
3. Deploy. Then put the Vercel address into `CORS_ORIGINS` on Render if you had left it empty.

Why `/backend`: the browser talks only to the Vercel domain, so the login cookie is first-party and works in every browser.

## 4. First Platform Admin (one time, on your own computer)
In `apps/api`, PowerShell. The values live only inside this one command:

    $env:DIRECT_URL="<neon connection string>"; $env:PLATFORM_ADMIN_EMAIL="you@example.com"; $env:PLATFORM_ADMIN_PASSWORD="<at least 12 characters>"; node scripts/seed-platform-admin.cjs; Remove-Item Env:DIRECT_URL, Env:PLATFORM_ADMIN_EMAIL, Env:PLATFORM_ADMIN_PASSWORD

It creates the admin only if none exists, and never prints the password.

## 5. After deploying
- Sign in as the Platform Admin and approve institutions as you do locally.
- Turn on 2FA for GitHub, Neon, Render and Vercel.
- Check that the login rate limit works from different devices (`TRUST_PROXY_HOPS=2` assumes Vercel + Render; if everyone seems to share one limit, try `1` or `3`).
