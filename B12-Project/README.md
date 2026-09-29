# 🩺 B12 Health Tracker

> **A full-stack, clinical-grade Vitamin B12 deficiency risk-assessment and symptom-tracking platform.**  
> Built with Next.js 16, Node.js Express, Supabase (PostgreSQL), and Docker.

---

## 🌟 Highlights

- **Adaptive Clinical Questionnaire**: 25 weighted questions analyzing diet, neurological markers, energy levels, digestive symptoms, and lifestyle indicators.
- **Embedded Clinical Risk Engine**: High-precision risk scoring (Low, Medium, High) with category-level breakdowns and personalized clinical suggestions.
- **Daily Symptom Protocol**: Track 5 core health dimensions daily (Energy, Fatigue, Mood, Sleep, Focus) with automatic streak tracking.
- **Progress & Trend Analytics**: Interactive trend graphs (Recharts) with pattern alerts (e.g. chronic fatigue or sleep disruption warnings).
- **Nutrient & Food Database**: Searchable library of 100+ B12-rich foods with category filters, microgram content, and % daily values.
- **BMI & Metabolic Health**: Built-in BMI calculator with historic tracking and personalized dietary guidance.
- **15-Layer Security Hardening**: Strict JWT authentication with token revocation/blacklisting, bcrypt password hashing, brute-force rate limiting, audit logging, Helmet headers, XSS cleaning, and parameter pollution protection.

---

## 🏗️ Architecture

```mermaid
graph TB
  subgraph "Client Layer"
    WEB["🌐 Next.js 16 Web App<br/>(React 19 + CSS Modules + Recharts)<br/>Port: 3001 | Deployed on Vercel"]
  end

  subgraph "API & Logic Layer"
    API["⚙️ Node.js Express API Gateway<br/>(15-Layer Security + Native Scoring Engine)<br/>Port: 3000 | Deployed on Railway / Docker"]
  end

  subgraph "Data & Cloud Layer"
    DB[("⚡ Supabase / PostgreSQL 16<br/>(13 Relational Tables + Audit Trail)<br/>SSL Pooler Port: 6543")]
  end

  WEB -->|"REST API (Bearer JWT)"| API
  API -->|"Sequelize ORM (SSL)"| DB
```

### Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | **Next.js 16 (App Router)** | React 19, Turbopack, CSS Modules, CSS custom tokens |
| **Data Viz** | **Recharts** | Interactive symptom tracking and progress charts |
| **Backend** | **Node.js + Express** | RESTful API, validation, audit logs, native scoring engine |
| **ORM** | **Sequelize** | Object-Relational Mapping for PostgreSQL |
| **Database** | **Supabase (PostgreSQL 16)** | Cloud managed database with 13 tables & ML-ready schema |
| **Security** | **JWT + Bcrypt + Helmet** | 15 security middlewares, brute-force protection, audit logs |
| **DevOps** | **Docker & Docker Compose** | Multi-stage production containerization |

---

## 📁 Project Structure

```text
B12/
├── B12-Project/
│   ├── frontend-web/              # Next.js 16 Frontend Web Application
│   │   ├── app/                   # App Router routes (11 full pages)
│   │   │   ├── auth/              # Login & Registration
│   │   │   ├── bmi/               # BMI Calculator & History
│   │   │   ├── checkin/           # Daily 5-metric symptom log
│   │   │   ├── dashboard/         # User hub, metrics & activity feed
│   │   │   ├── foods/             # B12 Nutrient food directory
│   │   │   ├── onboarding/        # 7-slide educational walkthrough
│   │   │   ├── profile/           # User profile & account management
│   │   │   ├── progress/          # Longitudinal trend analytics
│   │   │   ├── questionnaire/     # 25-step adaptive B12 risk test
│   │   │   ├── results/           # Complete clinical assessment breakdown
│   │   │   ├── score-preview/     # Guest result view & conversion funnel
│   │   │   ├── layout.js          # Root layout with typography & providers
│   │   │   └── page.js            # Smart router based on auth & completion state
│   │   ├── components/            # Reusable UI components & layouts
│   │   │   ├── layout/            # AppShell, Sidebar, TabBar (responsive)
│   │   │   └── UI/                # Skeleton, EmptyState, ErrorState, ThemeToggle, etc.
│   │   ├── context/               # React Context (AuthContext, AppContext)
│   │   ├── data/                  # Static question banks & B12 food sources
│   │   ├── services/              # API Client (authAPI, checkinAPI, usersAPI, etc.)
│   │   ├── Dockerfile             # Multi-stage production Docker container
│   │   └── package.json
│   │
│   ├── backend/
│   │   ├── node-service/          # Express API Gateway & Scoring Engine
│   │   │   ├── src/
│   │   │   │   ├── config/        # Database (db.js with Supabase SSL) & validateEnv.js
│   │   │   │   ├── middleware/    # Auth, security, rate-limiting, audit logging
│   │   │   │   ├── models/        # Sequelize models (User, Profile, Assessment, etc.)
│   │   │   │   ├── routes/        # Auth, Questionnaire, Checkin, Users, Insights
│   │   │   │   └── services/      # scoringEngine.js (Native JS clinical scoring)
│   │   │   ├── Dockerfile         # Node.js production Docker container
│   │   │   ├── railway.json       # Railway deployment configuration
│   │   │   └── server.js          # Main HTTP server entrypoint
│   │   │
│   │   └── database/              # PostgreSQL Schemas & Migrations
│   │       ├── migrations/        # 6 incremental SQL migration files
│   │       ├── seeds/             # Master 25-question bank seed file
│   │       └── supabase_setup.sql # 1-Click All-in-One Supabase Initialization Script
│   │
│   ├── docker-compose.yml         # Unified Docker Compose (Web + API + Supabase)
│   ├── DEPLOYMENT_GUIDE.md        # Comprehensive production deployment walkthrough
│   └── .env.docker.example        # Environment variable template
│
└── README.md                      # This documentation file
```

---

## 🚀 Quickstart (Local Development)

### Prerequisites

- **Node.js** (v18 or v20+)
- **Git**
- A **PostgreSQL** database or free **Supabase** account

---

### 1. Database Setup (Supabase)

1. Create a free project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in Supabase dashboard.
3. Open [`backend/database/supabase_setup.sql`](./backend/database/supabase_setup.sql), copy its contents, paste into the SQL editor, and click **Run**.
4. Copy your database connection string from **Project Settings ➔ Database ➔ URI**.

---

### 2. Configure Environment Variables

#### Backend (`backend/node-service/.env`):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DATABASE_SSL=true
JWT_SECRET=5f7a0fd5ccc99d4cd7e14a0e235ebc646ec23eaf71a97c13a95062fbcaeb4907
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3001
```

#### Frontend (`frontend-web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

### 3. Run Locally

Open two terminal windows:

#### Terminal 1 — Backend:
```bash
cd backend/node-service
npm install
npm run dev
```
*Health check:* `http://localhost:3000/health`

#### Terminal 2 — Frontend:
```bash
cd frontend-web
npm install
npm run dev -- -p 3001
```
*Open application in browser:* **`http://localhost:3001`**

---

## 🐳 Docker Deployment

To run both frontend and backend in isolated production containers:

1. Copy `.env.docker.example` to `.env` at root:
   ```bash
   cp .env.docker.example .env
   ```
2. Fill in your `DATABASE_URL` and `JWT_SECRET`.
3. Launch with Docker Compose:
   ```bash
   docker compose up --build -d
   ```
4. Access:
   - Web App: `http://localhost:3001`
   - API: `http://localhost:3000`

---

## ☁️ Cloud Production Deployment

Follow our detailed [**Deployment Guide**](./DEPLOYMENT_GUIDE.md) for step-by-step instructions:

| Component | Platform | Configuration |
|---|---|---|
| **Database** | **Supabase** | Run `supabase_setup.sql` in SQL Editor |
| **API Gateway** | **Railway / Render** | Root directory: `backend/node-service` |
| **Web Frontend** | **Vercel** | Root directory: `frontend-web` |

---

## 🔒 Security Architecture

The backend includes a **15-layer security stack**:

1. **Helmet**: Automated security HTTP headers (CSP, HSTS, X-Frame-Options).
2. **CORS Whitelisting**: Strict origin verification (`ALLOWED_ORIGINS`).
3. **JWT Blacklisting**: Revoked tokens are tracked in `token_blacklist` upon logout.
4. **Brute-Force Guard**: IP and account lockouts after 5 failed login attempts.
5. **Audit Logging**: Comprehensive security event recording in `audit_logs`.
6. **XSS Sanitization**: Strip dangerous HTML payloads from inputs.
7. **HPP Guard**: HTTP Parameter Pollution protection.
8. **Rate Limiting**: 100 requests per 15-minute sliding window.

---

## 📄 License & Medical Disclaimer

This project is licensed under the **MIT License**.

> ⚕️ **Medical Disclaimer**:  
> *The B12 Health Tracker is designed for educational awareness, wellness tracking, and research purposes only. It does not provide medical diagnoses or replace consultations with licensed healthcare professionals. Always consult a qualified physician for clinical evaluations and blood tests.*
