# 🚀 B12 Health Tracker — Production Deployment Guide
**Stack: Next.js (Vercel) + Node.js API (Railway / Docker) + PostgreSQL (Supabase)**

---

## 📋 Overview of What Was Prepared

1. **Python Eliminated**: The B12 scoring engine and trend analyzer have been ported directly into native JavaScript (`backend/node-service/src/services/scoringEngine.js`). The project is now **100% pure JavaScript**.
2. **Supabase Database Script**: All 6 migrations + initial question seeds have been compiled into a single copy-paste file:  
   `backend/database/supabase_setup.sql`
3. **Automatic SSL for Supabase**: Updated `db.js` so it automatically enables secure SSL whenever connecting to Supabase.
4. **Docker Ready**:
   - `backend/node-service/Dockerfile` + `.dockerignore` + `railway.json`
   - `frontend-web/Dockerfile` + `.dockerignore` + `vercel.json`
   - Root `docker-compose.yml`

---

## 🛠️ Step 1: Database Setup on Supabase (2 Minutes)

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**:
   - **Name**: `b12-tracker` (or any name you like)
   - **Database Password**: Choose a strong password and **remember it**.
   - **Region**: Pick the region closest to your users (e.g. `ap-south-1` for India / Mumbai, or `us-east-1`).
   - Click **Create new project**.
3. Once the dashboard loads:
   - Click the **SQL Editor** tab (icon on the left sidebar: `>_`).
   - Click **New Query**.
   - Open and copy the entire contents of `backend/database/supabase_setup.sql` from your project.
   - Paste it into the Supabase SQL editor and click **Run** (or `Ctrl + Enter`).
   - *Result*: All 13 tables, security tables, indexes, and all 25 questions are now live in Supabase!
4. Get your connection string:
   - Go to **Project Settings** (gear icon) ➔ **Database**.
   - Scroll to **Connection string** ➔ select **URI** (choose **Session Mode** or **Transaction Mode - Port 6543**).
   - Copy the URI. It looks like:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

---

## 🚂 Step 2: Deploy the Backend (Railway)

1. Push your project code to GitHub.
2. Go to [https://railway.app](https://railway.app) and sign in with GitHub.
3. Click **New Project** ➔ **Deploy from GitHub repo**.
4. Select your repository.
5. In **Settings** ➔ **Root Directory**, set it to:
   ```
   backend/node-service
   ```
6. In **Variables** (Environment Variables), add:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   JWT_SECRET=5f7a0fd5ccc99d4cd7e14a0e235ebc646ec23eaf71a97c13a95062fbcaeb4907
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://your-frontend-app.vercel.app,http://localhost:3001
   ```
7. Click **Deploy**.
8. Under **Networking** ➔ click **Generate Domain**. You will get a live URL like:
   `https://b12-api-production.up.railway.app`
9. Test it by opening in your browser:
   `https://b12-api-production.up.railway.app/health` ➔ should return `{"status":"healthy"}`.

---

## ▲ Step 3: Deploy the Frontend (Vercel)

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** ➔ **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click *Edit* and select:
     ```
     frontend-web
     ```
5. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Railway backend URL from Step 2 (e.g., `https://b12-api-production.up.railway.app`)
6. Click **Deploy**.
7. Vercel will build and assign you your live production URL (e.g. `https://b12-health-tracker.vercel.app`).
8. **Final Step**: Go back to Railway ➔ Variables ➔ update `ALLOWED_ORIGINS` to include your new Vercel domain!

---

## 🐳 Option B: Running with Docker (Any VPS or Server)

If you ever want to run both frontend and backend using Docker on any VPS (DigitalOcean, AWS, etc.):
1. Create a `.env` file at the root:
   ```env
   DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   JWT_SECRET=5f7a0fd5ccc99d4cd7e14a0e235ebc646ec23eaf71a97c13a95062fbcaeb4907
   ALLOWED_ORIGINS=http://localhost:3001,https://your-domain.com
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```
2. Run:
   ```bash
   docker compose up --build -d
   ```
   Both the Next.js web application (port 3001) and Node.js API (port 3000) will start and connect directly to your Supabase database.
