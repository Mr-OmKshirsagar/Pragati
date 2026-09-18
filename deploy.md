# PRAGATI — Production Deployment Guide
**Frontend on Vercel · Backend API on Render · Database & Storage on Supabase**

---

## 1. System Architecture & Topology

PRAGATI is architected as a decoupled full-stack platform. The repository is organized as a monorepo containing two core services:

```text
                           ┌──────────────────────────────────────────────┐
                           │               End Users                      │
                           │   (Students, Faculty, HODs, Admins, Super)   │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │          Vercel Production Edge              │
                           │       Single Page Application (SPA)          │
                           │     React 19 + Vite + Wouter + Tailwind      │
                           │         Domain: https://pragati.vercel.app   │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  │  HTTPS / tRPC API requests
                                                  │  (CORS Credentials: include)
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │             Render Web Service               │
                           │         Node.js + Express API Engine         │
                           │   tRPC Procedures + Drizzle ORM + Rule Engine│
                           │     Domain: https://pragati-api.onrender.com │
                           └───────┬──────────────┬──────────────┬────────┘
                                   │              │              │
                   Direct SQL /    │              │              │
                Connection Pooling │              │              │
                                   ▼              ▼              ▼
                  ┌──────────────────────┐ ┌──────────────┐ ┌─────────────┐
                  │   Supabase Cloud     │ │  Google AI   │ │ SMTP Server │
                  │  PostgreSQL Database │ │  Gemini API  │ │  (Gmail App │
                  │  Evidence Vault S3   │ │  (1.5 Flash) │ │   Password) │
                  │  Supabase Auth Engine│ │              │ │  2FA & Mails│
                  └──────────────────────┘ └──────────────┘ └─────────────┘
```

---

## 2. Pre-Deployment Prerequisites

Ensure you have the following accounts and credentials prepared before beginning:

1. **GitHub Account:** Repository containing the complete PRAGATI codebase pushed to your `main` branch.
2. **Supabase Account & Project:** 
   - A live Supabase project created at [supabase.com](https://supabase.com).
   - PostgreSQL Database connection string (Connection Pooler recommended).
   - Project URL, Anon Public Key, and Service Role Secret Key.
3. **Render Account:** An active account at [render.com](https://render.com).
4. **Vercel Account:** An active account at [vercel.com](https://vercel.com).
5. **Google Gemini API Key:** (Optional for AI evaluation features) From [aistudio.google.com](https://aistudio.google.com).
6. **SMTP Credentials:** For Super Admin 2FA verification and user account welcome emails:
   - For Gmail: A Google account with 2-Step Verification enabled and a dedicated 16-character **App Password** generated (do NOT use your personal Gmail password).

---

## 3. Phase 1 — Supabase Setup (Database, Storage & Auth)

### Step 1.1: Retrieve Supabase Project Credentials
From your Supabase Dashboard:
1. Navigate to **Project Settings** → **API**:
   - Copy **Project URL** (e.g., `https://xyzcompany.supabase.co`).
   - Copy **Project API Keys** → `anon` `public` key.
   - Copy **Project API Keys** → `service_role` `secret` key (never expose this to frontend).
2. Navigate to **Project Settings** → **Database**:
   - Under **Connection Pooling**, copy the pooled connection string:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
     > **Note:** Use port `5432` (Session pooler) or port `6543` (Transaction pooler). Ensure you replace `[YOUR-PASSWORD]` with your actual database password.

### Step 1.2: Create Evidence Storage Bucket
1. Navigate to **Storage** in the Supabase Dashboard.
2. Click **New Bucket**.
3. Bucket Name: `evidence-vault`
4. Set **Public Bucket** to `OFF` (Private, secured through signed URLs / service role).
5. Save the bucket.

### Step 1.3: Apply Database Schema & Migrations
Run the Drizzle database schema migrations from your local development machine pointing to your live production Supabase instance:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Run schema push or migration directly to Supabase
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npm run db:push

# 3. (Optional) Run initial seed data if setting up a fresh environment
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npm run seed
```

---

## 4. Phase 2 — Deploy Backend to Render

### Step 2.1: Create a New Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your PRAGATI GitHub repository.

### Step 2.2: Basic Configuration
Configure the web service parameters exactly as follows:

| Field | Configuration Value | Notes |
|---|---|---|
| **Name** | `pragati-api` | Will produce `https://pragati-api.onrender.com` |
| **Region** | Choose closest to Supabase (e.g., `Singapore`, `Frankfurt`, `Oregon`) | Minimizes database roundtrip latency |
| **Branch** | `main` | Production deployment branch |
| **Root Directory** | `backend` | **Crucial:** Targets the backend subfolder |
| **Runtime** | `Node` | LTS Node runtime |
| **Build Command** | `npm install --include=dev && npm run build` | Ensures TypeScript compiler & type declarations are available |
| **Start Command** | `npm start` | Executes `node dist/src/index.js` |
| **Instance Type** | `Free` or `Starter` | Free tier sleeps after 15 min of inactivity |

### Step 2.3: Health Check Path
Scroll down to **Advanced** and set:
- **Health Check Path:** `/health`
Render will periodically ping this endpoint to ensure the service is running and ready to receive traffic.

### Step 2.4: Configure Backend Environment Variables
In Render under the **Environment** tab, add the following key-value pairs:

```env
# Server & Runtime
NODE_ENV=production
PORT=10000

# Supabase Credentials
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_STORAGE_BUCKET=evidence-vault

# Super Admin Platform Governance
SUPER_ADMIN_EMAIL=platform-owner@yourinstitution.edu
SUPER_ADMIN_PASSWORD=<strong-random-password>
SUPER_ADMIN_MASTER_KEY=<strong-random-fallback-token-at-least-32-chars>

# SMTP Configuration (For 2FA OTP & Welcome Emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
EMAIL_FROM=PRAGATI Institutional Platform

# Optional: Catch-all email for demo account tests
DEMO_NOTIFICATION_EMAIL=your-email@gmail.com

# Assistive AI (Gemini 1.5 Flash)
GEMINI_API_KEY=<your-google-gemini-api-key>
GEMINI_MODEL=gemini-1.5-flash

# Frontend URLs allowed for CORS & Email Links
# (Set initial placeholder or your predicted Vercel URL, will be finalized in Phase 4)
FRONTEND_URL=https://pragati.vercel.app
VITE_APP_URL=https://pragati.vercel.app
```

> **Security Tip:** Do NOT surround values in quotes. For Gmail, ensure `SMTP_PASS` is the 16-character App Password without spaces.

### Step 2.5: Deploy and Verify Backend
1. Click **Create Web Service**.
2. Wait for the build logs to show:
   ```text
   ==> Docs / Health check at /health
   ==> [PRAGATI Backend] Server running on http://localhost:10000/
   ==> [PRAGATI Backend] Supabase Status: Connected
   ==> [PRAGATI Backend] Database Status: Connected
   ==> Your service is live 🎉
   ```
3. Copy your live Render URL (e.g. `https://pragati-api.onrender.com`).
4. Test the health endpoint in your terminal or browser:
   ```bash
   curl https://pragati-api.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "pragati-backend",
     "phase": "00-architecture-supabase",
     "database": {
       "configured": true,
       "driver": "postgres",
       "orm": "drizzle-orm"
     },
     "supabase": {
       "configured": true,
       "storageBucket": "evidence-vault"
     }
   }
   ```

---

## 5. Phase 3 — Deploy Frontend to Vercel

### Step 3.1: Import GitHub Project in Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Choose your Git repository and click **Import**.

### Step 3.2: Configure Project Settings
Configure the build & output settings in Vercel:

| Field | Configuration Value | Explanation |
|---|---|---|
| **Framework Preset** | `Vite` | Auto-detects Vite tooling |
| **Root Directory** | Click **Edit** → select `frontend` | **Crucial:** Directs Vercel to build the frontend directory |
| **Build Command** | `npm run build` | Executes `vite build` |
| **Output Directory** | `dist/public` | **Crucial:** PRAGATI Vite output is configured to `dist/public` |
| **Install Command** | `npm install` | Installs frontend dependencies |
| **Node.js Version** | `20.x` or `22.x` | In Project Settings → General |

### Step 3.3: Verify SPA Rewrites Configuration
Verify that `frontend/vercel.json` exists in your repository with the following rewrite rule:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
*This guarantees that client-side routes (like `/login`, `/super-admin-pragati01`, `/faculty`, `/admin`) resolve cleanly when refreshed or accessed directly.*

### Step 3.4: Configure Frontend Environment Variables
In Vercel under **Environment Variables**, add the variables for **Production**, **Preview**, and **Development**:

| Variable Name | Example Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://pragati-api.onrender.com` | **Your live Render Backend URL (no trailing slash)** |
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Supabase Public Project URL |
| `VITE_SUPABASE_ANON_KEY` | `<your-supabase-anon-key>` | Supabase Public Anonymous API Key |
| `VITE_APP_URL` | `https://pragati.vercel.app` | Vercel production deployment URL |

> **CRITICAL SECURITY RULE:** Only variables prefixed with `VITE_` are bundled into client JavaScript. NEVER add `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASS`, or `SUPER_ADMIN_MASTER_KEY` to Vercel.

### Step 3.5: Trigger Deployment
1. Click **Deploy**.
2. Vercel will install dependencies, build the static client via Vite, and publish to the global CDN edge.
3. Once completed, note down your live Vercel URL (e.g. `https://pragati.vercel.app`).

---

## 6. Phase 4 — Link Frontend & Backend (CORS & Auth Redirects)

Now that both domains are live, establish the bidirectional trust:

### Step 4.1: Update Render CORS Origins
1. Open your Render Dashboard → Select `pragati-api` → **Environment**.
2. Update `FRONTEND_URL` and `VITE_APP_URL` with your actual Vercel URL(s):
   ```env
   FRONTEND_URL=https://pragati.vercel.app,https://pragati-*.vercel.app
   VITE_APP_URL=https://pragati.vercel.app
   ```
   *(Multiple comma-separated URLs allow both production and Vercel preview branch deployments to communicate with your backend).*
3. Render will automatically re-deploy or reload the environment variables.

### Step 4.2: Update Supabase Auth Redirects
1. Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. Set **Site URL:**
   ```text
   https://pragati.vercel.app
   ```
3. Add to **Redirect URLs:**
   ```text
   https://pragati.vercel.app/**
   ```

---

## 7. Phase 5 — Verification & End-to-End Smoke Tests

Execute this verification sequence to confirm full system readiness:

### 1. API Connectivity & Health Check
- Open `https://pragati-api.onrender.com/health` in your browser.
- Verify status is `"ok"` and both `database.configured` and `supabase.configured` are `true`.

### 2. Frontend Interface & Asset Delivery
- Open `https://pragati.vercel.app/`.
- Open DevTools (F12) → **Console** and **Network** tabs.
- Confirm fonts, stylesheets, and images load with HTTP 200 without CORS warnings.

### 3. Student & Faculty Authentication Flow
- Visit `https://pragati.vercel.app/login`.
- Test institutional login for existing demo or registered users.
- Confirm successful redirection to the role-specific dashboard (`/student`, `/faculty`, `/admin`).

### 4. Super Admin 2FA Lifecycle (Full SMTP Verification)
- Navigate to the protected governance route:
  ```text
  https://pragati.vercel.app/super-admin-pragati01
  ```
- Enter your configured `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.
- Check the designated administrator mailbox for the 6-digit verification code.
  - Subject: `PRAGATI Super Admin - Security Verification Code`
- Enter the OTP on the verification prompt.
- Confirm entry to the Super Admin Governance Center (System health, tenant list, change requests).

### 5. Evidence Upload & Supabase Storage Verification
- As a Student, submit an internship report or certificate under `/internships`.
- Verify the file is uploaded to the Supabase `evidence-vault` bucket.
- Verify that preview and download buttons generate valid authenticated signatures.

---

## 8. Troubleshooting & Common Pitfalls

| Issue | Root Cause | Solution |
|---|---|---|
| **CORS Error in Browser** (`Cross-Origin Request Blocked`) | Backend `FRONTEND_URL` does not include the exact Vercel origin. | Update `FRONTEND_URL` in Render environment to match your Vercel URL exactly (no trailing slash, e.g. `https://pragati.vercel.app`). |
| **404 Not Found on Page Refresh** on Vercel | Vercel server is looking for a physical file instead of rewriting to `index.html`. | Verify `frontend/vercel.json` has `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` and redeploy frontend. |
| **Blank Screen / 404 in Vercel Deployment** | Vercel Output Directory is set to default `dist` instead of `dist/public`. | In Vercel Project Settings → General → Build & Development Settings, set **Output Directory** to `dist/public`. |
| **Render Free Tier Cold Starts** (Initial load takes 30–50 seconds) | Render spins down free web services after 15 minutes of zero traffic. | Set up a free monitoring ping using [UptimeRobot](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org) targeting `https://pragati-api.onrender.com/health` every 10 minutes, or upgrade to Render Starter tier. |
| **SMTP / 2FA Email Not Received** | Gmail App Password misconfigured, or port / TLS mismatch. | Ensure 2FA is on in Google Account and an **App Password** was generated. Set `SMTP_PORT=587` and `SMTP_SECURE=false`. Check Render logs for `[EmailService]` errors. |
| **Database Connection Failures** | Incorrect connection pooling port or credentials. | Verify `DATABASE_URL` in Render uses the Supabase connection pooler on port `5432` or `6543`. Test connection string locally using `psql` or `npm run db:push`. |
| **Render Build Failure:** `TS7016: Could not find declaration file for module 'cors'/'express'`, or `TS2307: Cannot find module 'nanoid'/'vitest'` | 1) `NODE_ENV=production` causes `npm install` to skip `devDependencies` where `@types/*` lived.<br>2) `nanoid` was missing from dependencies.<br>3) `tsconfig.json` was compiling `tests/` which requires `vitest`. | 1) Use Build Command `npm install --include=dev && npm run build`.<br>2) `package.json` now includes `nanoid` and type definitions in `dependencies`.<br>3) `tsconfig.json` excludes `tests/` from production build. Push the latest commit to GitHub and trigger a manual redeploy on Render. |
| **API Requests Hit `/api/trpc` on Vercel** instead of Render | `VITE_API_URL` missing or not set during Vercel build. | Ensure `VITE_API_URL` is set in Vercel environment variables, then trigger a manual **Redeploy** (do not use build cache). |

---

## 9. Environment Variable Cheat Sheet

### Render (Backend)
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_STORAGE_BUCKET=evidence-vault
SUPER_ADMIN_EMAIL=platform-owner@yourinstitution.edu
SUPER_ADMIN_PASSWORD=<random-password>
SUPER_ADMIN_MASTER_KEY=<random-secret-key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
EMAIL_FROM=PRAGATI Institutional Platform
DEMO_NOTIFICATION_EMAIL=your-email@gmail.com
GEMINI_API_KEY=<optional-gemini-key>
GEMINI_MODEL=gemini-1.5-flash
FRONTEND_URL=https://pragati.vercel.app
VITE_APP_URL=https://pragati.vercel.app
```

### Vercel (Frontend)
```env
VITE_API_URL=https://pragati-api.onrender.com
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_URL=https://pragati.vercel.app
```
