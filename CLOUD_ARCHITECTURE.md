# RepairGraph Cloud Architecture & Deployment Specification

## 1. Executive Summary

RepairGraph is an evidence-based product repair and lifecycle platform designed to help consumers, enterprise fleets, and independent technicians evaluate repair economics, diagnose hardware failure modes, orchestrate competitive repair quotes, track end-to-end repair jobs, and maintain standardized product service passports.

This document details the software architecture, security perimeter, and intended cloud deployment topology. It explicitly differentiates between **what is currently implemented in code** versus **target production cloud infrastructure**.

---

## 2. Intended Cloud Deployment Pipeline

The production architecture uses **GitHub as the canonical source of truth** for application code, deploying automatically through Vercel's Git integration to a serverless runtime connected to an independent managed PostgreSQL database.

```text
┌────────────────────────────────┐
│       Local RepairGraph        │
│      (Developer Machine)       │
└───────────────┬────────────────┘
                │ git push
                ▼
┌────────────────────────────────┐
│      GitHub Repository         │
│   (Canonical Source of Truth)  │
│  - Application code            │
│  - Prisma schema & migrations  │
│  - Automated test suites       │
└───────────────┬────────────────┘
                │ Git Integration (Webhooks)
                ▼
┌────────────────────────────────┐
│      Vercel Cloud Runtime      │
│  - Next.js 15 Serverless App   │
│  - Automatic Edge HTTPS/TLS    │
│  - Production Security Headers │
│  - In-memory Rate Limiting     │
└───────────────┬────────────────┘
                │ Pooled TLS Connection (DATABASE_URL)
                ▼
┌────────────────────────────────┐
│    Managed Cloud PostgreSQL    │
│   (Separate Managed Provider)  │
│  - 11 Normalized Entities      │
│  - PgBouncer Connection Pool   │
│  - ACID Relational Integrity   │
└────────────────────────────────┘
```

> [!IMPORTANT]
> **Environment Separation:**
> - **Development Database**: `localhost:5432/repairgraph` (local PostgreSQL used exclusively for development and offline testing).
> - **Production Database**: A dedicated, independent managed cloud PostgreSQL instance (e.g., Neon, Supabase, AWS RDS). The local database is **never** exposed or reused for production.

---

## 3. Currently Implemented Software Architecture (Step 4A Hardening)

The following components and security controls are **fully implemented, tested, and active in the local codebase**:

### 3.1 Security & Session Architecture
- **HTTP-Only Session Cookie (`rg_token`)**: Browser authentication uses an HTTP-only cookie with `SameSite=lax` and `Path=/`. The `Secure` flag is enforced in production environments.
- **Raw JWT Token Suppression**: Browser responses from `/api/auth/login` and `/api/auth/register` return only the sanitized user profile. Raw JWT tokens are **omitted** from JSON payloads by default to eliminate `localStorage`/`sessionStorage` XSS exposure. A query parameter `?includeToken=true` is available strictly for automated API testing and non-browser integration clients.
- **Sliding-Window Rate Limiting** (`src/server/auth/rateLimit.ts`): An in-memory sliding-window limiter blocks authentication brute-force attacks:
  - Max 10 login requests / minute per client IP.
  - Max 5 registration requests / minute per client IP.
  - Returns RFC 7807 structured HTTP 429 `RATE_LIMIT_EXCEEDED` with `Retry-After` header.
- **Production HTTP Security Headers** (`next.config.ts`): Applied uniformly to all routes:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 3.2 Health & Observability Endpoint
- **Endpoint**: `GET /api/health`
- **Function**: Executes an active database ping (`SELECT 1`) to verify connection pool responsiveness.
- **Telemetry**: Measures round-trip query latency in milliseconds, process uptime, timestamp, and runtime environment.
- **Payload**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "RepairGraph API",
      "database": "connected",
      "latencyMs": 7,
      "uptime": 420,
      "timestamp": "2026-09-11T18:14:20.614Z",
      "environment": "development"
    }
  }
  ```
- **Security**: Sanitized response—no connection strings, internal IP addresses, database credentials, or stack traces are exposed. Returns HTTP 503 if the database is unreachable.

### 3.3 Data Layer & Entity Relationships
- **ORM**: Prisma Client with 11 normalized relational entities (`User`, `CustomerProfile`, `Repairer`, `RepairerSpecialization`, `Device`, `RepairRequest`, `Diagnosis`, `Quote`, `RepairJob`, `RepairHistory`, `Review`).
- **Complete Device CRUD**: Fully implemented backend (`GET`, `POST`, `PUT`, `DELETE` on `/api/devices`) and frontend modals on `/devices` and `/devices/[id]` for editing hardware condition and valuation.
- **Standardized Service Passport**: Tamper-evident maintenance ledger tied to physical serial numbers. Explicitly avoids unsupported claims of blockchain/cryptographic proofs; grounded in India's **Right to Repair framework** and **E-Waste (Management) Rules, 2022**.

---

## 4. Target Production Cloud Infrastructure (Step 4B — Pending Manual Setup)

When deployed to production, the target infrastructure will leverage cloud-managed capabilities:

| Component | Target Provider | Operational Role | Status |
|---|---|---|---|
| **Source of Truth** | GitHub Repository | Version control, CI triggers, audit history | Pending user manual push |
| **Compute & API** | Vercel Serverless (Next.js) | Dynamic route execution, SSR/SSG rendering, edge caching | Pending GitHub repository connection |
| **Edge Network** | Vercel Edge / Cloudflare Anycast | Global TLS termination, DDoS defense, static asset caching | Target capability (active upon Vercel deployment) |
| **Database** | Managed Cloud PostgreSQL (e.g. Neon, Supabase) | Relational persistence, PgBouncer serverless pooling | Pending cloud instance provisioning |

> [!NOTE]
> **Production Readiness vs. Active Deployment:**
> The codebase is architecturally **prepared** for production deployment. However, active cloud deployment (Step 4B) requires user-authorized GitHub repository creation, Vercel Git integration, and managed PostgreSQL provisioning.

---

## 5. Deployment Checklist & Runbook

The sequential runbook for completing cloud deployment (Step 4B):

1. **Review Local Working Tree**: Verify all files with `git status` and `git diff`.
2. **User Manual Commit**: Commit changes locally with a descriptive commit message.
3. **User Manual Push**: Attach GitHub remote and push to `main` branch.
4. **Connect GitHub to Vercel**: Import the GitHub repository in the Vercel dashboard.
5. **Provision Managed PostgreSQL**: Create an independent database on a managed cloud provider (e.g., Neon serverless PostgreSQL).
6. **Configure Production Secrets**:
   - `DATABASE_URL`: Pooled connection string.
   - `DIRECT_URL`: Direct connection string for migrations.
   - `JWT_SECRET`: 32+ character cryptographically secure string.
   - `NODE_ENV`: `production`.
7. **Deploy Prisma Migrations**: Run `npx prisma migrate deploy` against the managed database.
8. **Verify Production Health**: Inspect `https://<production-url>/api/health`.
9. **Execute Production Smoke Tests**: Run `npx tsx scripts/smoke-test.ts https://<production-url>`.
