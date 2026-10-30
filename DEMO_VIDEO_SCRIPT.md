# RepairGraph — BACSE344 DA3 3-Minute Demo Video Script & Walkthrough Guide

**Course**: BACSE344 — Cloud Infrastructure and Architecture (C1 Slot)  
**Student Name**: Naidu Reshmanth Sai  
**Registration Number**: 25BCE1112  
**Faculty Evaluator**: Dr. P. Anandan (VIT Chennai)  
**Evaluation Target**: 10.0 / 10.0 Marks  
**Target Video Duration**: Exactly 2:50 – 2:58 (Under 3:00 Minutes Maximum)  
**Production URL**: https://repairgraph.vercel.app  
**Git Branch**: `assignment-3` (Commit: `cb525b7`)  

---

## 1. Pre-Recording Setup: Exactly What to Open & Arrange

Before hitting record, split your monitor into two clean halves (or use two monitors):

### Left Half: Terminal Window
- **Directory**: `/Users/sai/RepairGraph` on branch `assignment-3`
- **Font Size**: 16pt or 18pt (high contrast, easy to read on 1080p video)
- **Pre-run check**: Ensure containers are active (`docker compose ps`)
- **Commands Pre-typed in Terminal History** (press Up-Arrow during video):
  1. `docker compose ps`
  2. `for i in {1..6}; do curl -s http://localhost:8080/api/health | jq .data.instance; done`
  3. `bash scripts/load-test.sh`
  4. `bash scripts/chaos-failover-test.sh`
  5. `npx tsx scripts/verify-password-security.ts`
  6. `npx tsx scripts/verify-rbac-totp.ts`
  7. `docker images | grep repairgraph`

### Right Half: Web Browser (Chrome)
Keep the following tabs open and ordered from left to right:
- **Tab 1: Live Production App**: `https://repairgraph.vercel.app` (Showing homepage)
- **Tab 2: System Architecture Diagram**: Open `docs/da3-architecture-diagram.svg` (or Page 9 of `RepairGraph_DA3_Report.pdf`)
- **Tab 3: Live Dedicated MFA Portal**: `http://localhost:8080/mfa` (Showing the QR Code & 6-digit TOTP form)
- **Tab 4: Generated PDF Report**: `RepairGraph_DA3_Report.pdf` (Page 2 Rubric Matrix or Page 13 Trivy Table)

---

## 2. Second-by-Second Presentation Script & On-Screen Actions

### [0:00 – 0:30] Introduction, Student Identity & Peak-Demand Situation (Q1.a)
- **What to Show on Screen**: 
  - Start with Browser on Tab 1 (`https://repairgraph.vercel.app`), then switch mouse to Left Terminal showing `docker compose ps`.
- **Action**: Run `docker compose ps` in terminal.
- **Word-for-Word Speech**:
  > *"Hello everyone and respected faculty Dr. P. Anandan. My name is **Naidu Reshmanth Sai**, registration number **25BCE1112**, C1 Slot. This is my Digital Assignment 3 demonstration for **BACSE344: Cloud Infrastructure and Architecture**.*
  >
  > *Continuing directly from Assignment 1, this project scales **RepairGraph**—our cloud-native circular electronics repairability and e-waste passport platform.*
  >
  > *In our domain, the peak-demand scenario is the **Quarterly National E-Waste Amnesty and Extended Producer Responsibility (EPR) Filing Surge**, where hundreds of refurbishment centers concurrently triage hardware. The heaviest route is `POST /api/diagnostics/triage`, which executes deterministic symptom parsing and database queries against Neon Serverless PostgreSQL.*
  >
  > *To handle this surge with zero bottlenecks, we provisioned three Docker container replicas balanced behind an Nginx reverse proxy on port 8080."*

---

### [0:30 – 1:00] Round-Robin Load Distribution & Apache Bench Benchmark (Q1.a & Q1.b)
- **What to Show on Screen**: 
  - Focus on Terminal window.
- **Action**: 
  - Run: `for i in {1..6}; do curl -s http://localhost:8080/api/health | jq .data.instance; done`
  - Show the output alternating `backend-1` ➔ `backend-2` ➔ `backend-3`.
  - Point to the Apache Bench results table on Page 8 of report or run `bash scripts/load-test.sh`.
- **Word-for-Word Speech**:
  > *"Here in the terminal, you can see sequential requests alternating across `backend-1`, `backend-2`, and `backend-3` in pure Layer-7 round-robin fashion, with each container connected via pooled TLS to Neon PostgreSQL.*
  >
  > *Next, we evaluated performance under stress using Apache Bench, firing 1,000 requests at 20 concurrent connections against our triage route.*
  >
  > *Comparing single instance against our 3-instance cluster:*
  > *- Throughput skyrocketed by **+106.25%**, leaping from **40.64 requests per second up to 83.82 RPS**.*
  > *- Mean latency was cut in half, dropping **51.52% from 492 milliseconds down to 238 milliseconds**.*
  > *- Most importantly, all 1,000 requests completed with **zero dropped connections and 100% success**."*

---

### [1:00 – 1:30] Chaos Engineering: Zero-Downtime Failover Tuning (Q1.c)
- **What to Show on Screen**: 
  - Stay in Terminal.
- **Action**: 
  - Run `bash scripts/chaos-failover-test.sh` (or highlight the chaos test output showing `Failed requests: 0`).
- **Word-for-Word Speech**:
  > *"Next, to prove high availability, we conducted a Chaos Engineering experiment: abruptly killing container `backend-2` mid-flight during an active 1,000-request benchmark.*
  >
  > *Under default Nginx configuration, this dropped TCP sockets and produced **68 failed requests with HTTP 502 Bad Gateway**.*
  >
  > *However, by reconfiguring Nginx with proactive health monitoring and `proxy_next_upstream error timeout invalid_header http_500 http_502 http_503` with 3 retries, Nginx instantly catches the severed socket in under one millisecond and re-routes the request to healthy replicas.*
  >
  > *As verified here, all **1,000 requests succeeded with exactly 0 failed requests**, achieving true zero downtime."*

---

### [1:30 – 2:00] System Architecture, Cloud Bursting & Fog Computing (Q1.d)
- **What to Show on Screen**: 
  - Switch to Browser Tab 2 showing `docs/da3-architecture-diagram.svg` (or Page 9 of the PDF report).
- **Action**: 
  - Move mouse cursor to circle the **Violet Cloud Bursting box** (top right) and the **Amber Fog Computing box** (bottom left).
- **Word-for-Word Speech**:
  > *"Here is our end-to-end architecture diagram: showing our Next.js frontend, Nginx reverse proxy on port 8080, three Docker replicas on ports 3001, 3002, and 3003, and our managed Neon PostgreSQL database in AWS Singapore.*
  >
  > *Highlighted in violet is our **Cloud Bursting component**: if request queue depth crosses 80%, traffic automatically bursts into ephemeral Vercel Serverless Edge Functions or AWS ECS Fargate, scaling for transient amnesty surges without paying for continuous over-provisioning.*
  >
  > *Highlighted in amber is our **Edge and Fog Computing component**: these are offline rapid triage kiosks deployed at physical repair shops and recycling yards that inspect hardware and issue local QR passports with zero latency, synchronizing batch records to Neon DB once internet connectivity restores."*

---

### [2:00 – 2:30] Bcrypt Password Cryptography, TOTP MFA Portal & RBAC (Q2.a & Q2.b)
- **What to Show on Screen**: 
  - Split view: Run verification script in Terminal, then switch to Browser Tab 3 (`http://localhost:8080/mfa`).
- **Action**: 
  - In Terminal, run: `npx tsx scripts/verify-password-security.ts` followed by `npx tsx scripts/verify-rbac-totp.ts`.
  - In Browser, show the live `/mfa` screen with the scannable QR code and 6-digit input form.
- **Word-for-Word Speech**:
  > *"Turning to security: RepairGraph protects sensitive customer PII, device serial numbers, and diagnostic invoices. In our database, user passwords are encrypted using **10-round salted bcrypt cryptography** ($2^{10} = 1,024$ work factor). As shown in terminal, identical passwords produce completely unique 22-character salts, mathematically neutralizing rainbow table attacks.*
  >
  > *In Question 2.b, we implemented **RFC 6238 TOTP multi-factor authentication**. Here on screen is our live onboarding portal at `/mfa`, generating rotating 6-digit codes compatible with Google and Microsoft Authenticator.*
  >
  > *We also enforced Role-Based Access Control on mutation endpoints. As proven in the CLI output:*
  > *- Unauthenticated requests are rejected with **HTTP 401 Unauthorized**.*
  > *- A standard user attempting device deletion is rejected with **HTTP 403 Forbidden**.*
  > *- Only an elevated Administrator with an active MFA session is authorized."*

---

### [2:30 – 2:55] Aqua Security Trivy Scan, Image Hardening & Threat Regulations (Q2.c & Q2.d)
- **What to Show on Screen**: 
  - Switch to Terminal showing `docker images | grep repairgraph` or the Trivy comparison table on Page 13 of the report.
- **Action**: 
  - Run `docker images | grep repairgraph` in terminal (shows 364 MB vs 2.94 GB).
- **Word-for-Word Speech**:
  > *"In Question 2.c, we audited container vulnerabilities using **Aqua Security Trivy**.*
  > *Our baseline Debian image contained **506 CVEs (24 CRITICAL)** and ran as root.*
  > *We hardened the container using a multi-stage Alpine build, standalone Next.js artifact pruning, and enforced an unprivileged non-root user (`nextjs`, UID 10001).*
  > *This collapsed vulnerabilities by **96.8% down to just 16 CVEs with 0 OS-level vulnerabilities**, while shrinking image footprint by **87.6%, from 2.94 GB down to 364 MB**.*
  >
  > *Finally, we modeled domain threats: Rogue Technicians stealing customer data are mitigated by RBAC and TOTP under **India's DPDPA 2023 Section 8(5) and GDPR Article 32**; while External Credential Stuffers are neutralized under the **E-Waste Rules 2022**.*
  >
  > *All code, test suites, and documentation are committed to branch `assignment-3`. Thank you!"*

---

## 3. Quick Command Copy-Paste Reference

Keep this terminal snippet handy for testing or executing during rehearsal:

```bash
# Check Docker cluster
docker compose ps

# Demonstrate Round Robin (6 requests)
for i in {1..6}; do curl -s http://localhost:8080/api/health | jq .data.instance; done

# Demonstrate Bcrypt Salted Hashes & Rainbow Immunity
npx tsx scripts/verify-password-security.ts

# Demonstrate RBAC 401/403 Rejections & TOTP MFA
npx tsx scripts/verify-rbac-totp.ts

# Demonstrate Hardened Container Footprint
docker images | grep repairgraph
```
