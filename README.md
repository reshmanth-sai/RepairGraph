# RepairGraph

> **Intelligent Product Repair & Lifecycle Platform**  
> An evidence-based hardware diagnostics, repairability evaluation, fair-market economics, competitive quote orchestration, and standardized device service passport platform.

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

## 3. Quick Start & Local Setup

### Prerequisites
- Node.js 20+ (LTS)
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
# Run 17 automated business rule & API tests
npm test

# Run ESLint validation
npm run lint

# Run full Next.js static & dynamic production build
npm run build
```

---

## 5. API Reference Summary

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

## 6. Regulatory Alignment

RepairGraph's data structures and provenance tracking are modeled to support:
- **India Right to Repair Portal (Department of Consumer Affairs)**: Standardizing diagnostic manuals, genuine parts transparency, and authorized/independent repairer certification.
- **E-Waste (Management) Rules, 2022**: Tracking product lifecycles to promote repair over premature disposal and facilitate authorized recycling upon end-of-life.
