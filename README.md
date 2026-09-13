# RepairGraph

> **Intelligent Product Repair & Lifecycle Platform**  
> An evidence-based hardware diagnostics, repairability evaluation, fair-market economics, competitive quote orchestration, and standardized device service passport platform.  
>  
> **Live Production Deployment**: [https://repairgraph.vercel.app](https://repairgraph.vercel.app)  
> **Author**: Naidu Reshmanth Sai (Registration No: 25BCE1112)

![RepairGraph Cloud Architecture](docs/cloud-architecture.svg)

---

## 1. Product Overview

RepairGraph replaces guesswork and fragmented local repair experiences with an end-to-end evidence-based lifecycle platform aligned with India's **Right to Repair framework** and the **E-Waste (Management) Rules, 2022**.

When consumer or enterprise hardware fails, RepairGraph enables users to:
1. **Catalog Physical Hardware**: Maintain a ledger of devices with model metadata, serial numbers, purchase price, fair market valuation, and warranty status.
2. **Diagnose Symptoms**: Evaluate failure modes across thermal, display, power, and motherboard systems.
3. **Assess Repairability & Economics**: Weigh repair quotes against the device's remaining fair market value and depreciation trajectory.
4. **Orchestrate Competitive Quotes**: Connect with verified independent technicians and compare bids based on parts transparency, estimated turnaround, and warranty.
5. **Track Repair Execution**: Follow repair status from quote acceptance to bench testing.
6. **Maintain a Standardized Repair Passport**: Create a standardized, tamper-evident maintenance ledger tied to each physical serial number without misleading blockchain claims.

---

## 2. Technical Stack & Architecture

- **Frontend & App Framework**: [Next.js 15 (App Router)](https://nextjs.org/) with [React 19](https://react.dev/) and Turbopack.
- **Styling & Design System**: Tailwind CSS v4 using an industrial editorial design system (warm stone `#fafaf9`, deep charcoal `#1c1917`, international safety orange `#ea580c`, monospace tabular figures).
- **Backend & API Layer**: Next.js Route Handlers layered into Validators (`zod`), Business Services, and Error Handlers (`AppError`).
- **Database & ORM**: PostgreSQL 16 managed database with [Prisma ORM](https://www.prisma.io/) (11 normalized relational entities).
- **Authentication & Security**:
  - `bcrypt` password hashing (salt rounds = 10).
  - HMAC-SHA256 signed JSON Web Tokens (JWT) stored exclusively in `HttpOnly`, `SameSite: lax`, `Secure` cookies (`rg_token`).
  - Raw tokens suppressed from browser JSON responses by default.
  - In-memory sliding window rate limiting on authentication routes (`10 req/min` for login, `5 req/min` for register).
  - Comprehensive HTTP security headers (`nosniff`, `DENY`, `HSTS`, `Permissions-Policy`, `Referrer-Policy`).
- **Observability**: Real-time health monitoring endpoint (`GET /api/health`) performing active PostgreSQL ping queries (`SELECT 1`) with measured millisecond roundtrip latency.

For full architectural details, see [CLOUD_ARCHITECTURE.md](CLOUD_ARCHITECTURE.md).

---

## 3. Diagnostic Intelligence & Deterministic Decision Engine

RepairGraph implements a **Two-Tier Hybrid Architecture** designed specifically for auditability, regulatory compliance, and viva defensibility. It avoids unconstrained black-box LLMs for financial and scoring decisions:

```text
User Free-Text Symptoms & Device Metadata
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: Deterministic Rule-Based Symptom Extraction         │
│ • Heuristic word-boundary token parser (\b)                 │
│ • Failure mode classification (Display, Battery, Board, etc.)│
│ • Safety hazard detection (swollen cells, liquid ingress)   │
│                 ↓                                           │
│ Structured Diagnostic Signals (Category, Confidence, Flags) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Deterministic Decision Engine (Rules & Formulas)    │
│ • 7-Factor Repairability Score Model (Sum: 100 pts)         │
│ • Brand-scaled component parts & labor cost matrix          │
│ • Repair Cost Ratio (RCR = C_repair / V_current)            │
│ • Statutory Lifecycle Matrix (E-Waste Rules, 2022)          │
│                 ↓                                           │
│ Action: REPAIR | DIY | REPLACE | RESELL | RECYCLE           │
│ Multi-paragraph explainability (Economics, Feasibility, CO2)│
└─────────────────────────────────────────────────────────────┘
```

### The 7-Factor Repairability Score Model ($25 + 20 + 15 + 15 + 10 + 10 + 5 = 100$)

The baseline design repairability score ($S_{\text{baseline}} \in [0, 100]$) uses an original RepairGraph weighting model informed by general repairability principles, evaluating seven engineering dimensions:

1. **Physical Disassembly & Fasteners (25 points / 25%)**: Standard Phillips/Torx captive screws vs. ultrasonic welding, Pentalobe/tri-point screws, or perimeter adhesive seams.
2. **Spare Parts Availability (20 points / 20%)**: Commercial availability of genuine OEM and aftermarket replacement modules in the domestic supply chain.
3. **Documentation & Repair Manuals (15 points / 15%)**: Public availability of official Hardware Maintenance Manuals (HMM), circuit schematics, and torque specifications.
4. **Hardware Modularity (15 points / 15%)**: Independent daughterboards, socketed SO-DIMM/M.2 slots, and modular fans vs. fully soldered unified memory and NAND storage.
5. **Software Locks & Parts Pairing (10 points / 10%)**: Absence of cryptographic serialization pairing barriers; availability of public on-device calibration utilities.
6. **Device Age & Lifecycle Support (10 points / 10%)**: Remaining useful lifespan and active security/parts support window: $\max(0, \min(10, \text{round}(10 - 1.5 \times \text{ageYears})))$.
7. **Local Service Ecosystem & Tools (5 points / 5%)**: Density of certified independent repair workshops and standard tool accessibility across Indian metropolitan hubs.

**Incident Risk Deductions**:
When evaluating an active repair incident, acute hazards apply explicit deductions from the baseline:
- Liquid ingress risk: $-20$ pts
- Core logic-board fault: $-15$ pts
- Power failure / PMIC short: $-10$ pts
- Critical hardware severity: $-10$ pts

$$\text{Final Repairability Score } S_{\text{repair}} = \max\left(10, \min\left(98, S_{\text{baseline}} - C_{\text{penalties}}\right)\right)$$

### Economic Repair-vs-Replace Model

1. **Repair Cost Ratio ($RCR$)**:
   $$RCR = \frac{C_{\text{repair}}}{\text{Current Fair Market Value } (V_{\text{current}})}$$
2. **Economic Score ($S_{\text{econ}} \in [0, 100]$)**:
   $$S_{\text{econ}} = \max\left(0, \min\left(100, \text{round}\left((1 - RCR) \times 100\right)\right)\right)$$

### Lifecycle Decision Matrix
- **`DIY`**: $RCR \le 0.28$ **AND** $S_{\text{repair}} \ge 72$ **AND** component is user-swappable (e.g. Framework modular battery).
- **`REPAIR`**: $RCR \le 0.52$ **AND** $S_{\text{repair}} \ge 42$. Professional repair preserves value and prevents premature replacement.
- **`RESELL`**: $0.50 < RCR \le 0.75$ with operational subsystems. Trade-in or salvage recovery offers higher utility.
- **`REPLACE`**: $RCR > 0.75$ **OR** Device Age $\ge 6$ years **OR** $S_{\text{repair}} < 35$. Capital is better deployed to modern hardware.
- **`RECYCLE`**: Catastrophic liquid damage + power failure **OR** $RCR > 0.92$. Channels device to authorized recyclers under **India's E-Waste (Management) Rules, 2022**.

### Viva Defense: Why a Deterministic Rule Engine Rather Than an AI/ML Model?
1. **No Generative-Model Hallucination**: There is no generative-model hallucination in the scoring and decision layer; results are deterministic and reproducible.
2. **Deterministic & Reproducible**: Identical symptom inputs and device contexts produce consistent, verifiable diagnostic signals and scores without stochastic variance.
3. **Sub-Millisecond Performance**: Executes in $< 1$ ms on serverless and edge runtimes without external API latency, network dependencies, or per-token operational costs.
4. **Transparent Audit Trail**: Every score point, economic threshold, and lifecycle recommendation is traceable to explicit rule matrices and cost benchmarks rather than an opaque black box.

---

## 3. Quick Start & Local Setup

### Prerequisites
- Node.js 24+ (LTS)
- npm or yarn
- Local or managed PostgreSQL instance

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> repairgraph
cd repairgraph
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your active PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/repairgraph?schema=public"
JWT_SECRET="development-secret-must-be-32-chars-long-minimum!!"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Apply Migrations & Seed Database
```bash
# Push schema migrations to PostgreSQL
npx prisma migrate dev

# Seed database with sample devices, technicians, quotes, and repair history
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Test Suite & Quality Assurance

RepairGraph includes a comprehensive automated test suite verifying data models, business rules, authorization boundaries, rate limiting, and full repair lifecycle state machines:

```bash
# Run automated engine, business rule, and integration tests
npm test

# Run deterministic diagnostic engine unit tests
npx tsx tests/engine.test.ts

# Run ESLint validation
npm run lint

# Run full Next.js static & dynamic production build
npm run build
```

---

## 5. Production Deployment Runbook

RepairGraph is deployed as a unified full-stack Next.js application on **Vercel** connected over pooled TLS to managed **Neon Serverless PostgreSQL**.

### Prerequisites
- **Node.js**: `24+` (LTS)
- **npm**: `11+`
- **Database**: Managed PostgreSQL 16+ (Neon Serverless PostgreSQL)
- **Target Platform**: Vercel Serverless ([https://repairgraph.vercel.app](https://repairgraph.vercel.app))

### 1. Environment Variables Checklist
Configure the following in your production environment settings (never commit secret values):
```env
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require"
JWT_SECRET="<generate-high-entropy-string-at-least-32-chars-long>"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://repairgraph.vercel.app"
```

> [!WARNING]
> **Production Migration Safety Rules:**
> - Do not use `prisma db push` for production.
> - Do not use `prisma migrate dev` for production.
> Always apply existing versioned migrations using `npx prisma migrate deploy`.

### 2. Deployment Execution Sequence
```bash
# 1. Install production dependencies
npm ci

# 2. Deploy database migrations to production Neon PostgreSQL
npx prisma migrate deploy

# 3. Generate Prisma client & compile Next.js production build
npm run build

# 4. Deploy to Vercel
# Handled via Vercel Git integration on push to main or via Vercel CLI
```

### 3. Post-Deployment Verification
1. **Health Ping**: Verify `GET https://repairgraph.vercel.app/api/health` returns HTTP 200 with `"status": "ok"` and `"database": "connected"`.
2. **Protected Route Authorization**: Verify unauthenticated calls to `GET /api/devices` return HTTP 401 `UNAUTHENTICATED`.
3. **Smoke Test Safety**: The integration suite `scripts/smoke-test.ts` includes authenticated tests that require the sample consumer account. For an unseeded production instance, verify health and public routes directly.
4. **Demo Personas**: Demo accounts (`consumer@repairgraph.internal`, `technician@repairgraph.internal`, `admin@repairgraph.internal`) are only created when `npx prisma db seed` is explicitly executed. Production remains clean by default.

---

## 6. API Reference Summary

All API routes are served under `/api` and return standardized JSON payloads:

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create customer or technician account (Rate limited: 5/min)
- `POST /api/auth/login` — Authenticate and receive `HttpOnly` cookie (Rate limited: 10/min)
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Inspect authenticated user profile

### Devices (`/api/devices`)
- `GET /api/devices` — List owned devices (with search and category filters)
- `POST /api/devices` — Register new physical device
- `GET /api/devices/:id` — Inspect device details, active issues, and service history
- `PUT /api/devices/:id` — Update device metadata, condition, and valuation
- `DELETE /api/devices/:id` — Remove device from personal catalog

### Lifecycle, Quotes & Jobs
- `GET /api/repair-requests` — List open repair requests
- `POST /api/repair-requests` — Submit diagnosis and repair request for owned hardware
- `GET /api/repair-requests/:id` — Inspect request details and incoming quotes
- `POST /api/repair-requests/:id/quotes` — Submit technician quote (Technicians only)
- `PUT /api/quotes/:id` — Accept quote (Owner only; transitions request to job)
- `GET /api/repair-jobs` — List active repair jobs
- `PUT /api/repair-jobs/:id` — Update job status (`IN_PROGRESS`, `AWAITING_PARTS`, `TESTING`, `COMPLETED`)
- `GET /api/repair-history` — Standardized Repair Passport ledger
- `POST /api/reviews` — Review completed repair job

### System & Health (`/api/health`)
- `GET /api/health` — Returns DB connection health, latency, uptime, and timestamp:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "RepairGraph API",
      "database": "connected",
      "latencyMs": 8,
      "uptime": 240,
      "timestamp": "2026-09-11T18:15:00.000Z",
      "environment": "production"
    }
  }
  ```

---

## 7. Regulatory Alignment

RepairGraph's data structures and provenance tracking are modeled to support:
- **India Right to Repair Portal (Department of Consumer Affairs)**: Standardizing diagnostic manuals, genuine parts transparency, and authorized/independent repairer certification.
- **E-Waste (Management) Rules, 2022**: Tracking product lifecycles to promote repair over premature disposal and facilitate authorized recycling upon end-of-life.
