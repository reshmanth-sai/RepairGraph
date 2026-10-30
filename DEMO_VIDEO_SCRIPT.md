# RepairGraph — DA3 3-Minute Demo Video Script

**Course**: BACSE344 — Cloud Infrastructure and Architecture (C1 Slot)  
**Student Name**: Naidu Reshmanth Sai  
**Registration Number**: 25BCE1112  
**Target Duration**: Exactly 3 Minutes (180 Seconds)

---

## Pre-Recording Screen Setup

Open the following windows side-by-side on your monitor:
1. **Left Half**: Terminal running in `/Users/sai/RepairGraph` on branch `assignment-3`.
2. **Right Half**: Browser showing:
   - Tab 1: Architecture Diagram (`docs/da3-architecture-diagram.svg`) or `RepairGraph_DA3_Report.html`
   - Tab 2: `http://localhost:8080/api/diagnostics/triage?category=LAPTOP&brand=Apple&model=MacBook+Pro+M3&symptoms=Battery+draining+rapidly+and+overheating`
   - Tab 3: Live production deployment: `https://repairgraph.vercel.app`

---

## 3-Minute Timeline & Narration Script

### [0:00 – 0:30] Introduction & Peak-Demand Domain Scenario (Q1.a)
- **What to Show on Screen**: 
  - Show the live website (`https://repairgraph.vercel.app`) and switch to Terminal showing `docker compose ps`.
- **What to Say**:
  > *"Hello everyone and respected faculty. My name is Naidu Reshmanth Sai, registration number 25BCE1112. This is my Digital Assignment 3 for BACSE344 Cloud Infrastructure and Architecture, continuing my project **RepairGraph**—an intelligent hardware diagnostics, repairability, and electronic waste passport platform.*
  >
  > *In our domain, the peak-demand event is a **National E-Waste Amnesty & Extended Producer Responsibility (EPR) Compliance Reporting Surge**, where hundreds of authorized repair centers and corporate fleet managers flood the platform to triage damaged hardware and generate authenticated e-waste passports. The hardest-hit API is `POST /api/diagnostics/triage`, which computes our deterministic 7-factor repairability score and queries our live Neon serverless PostgreSQL database.*
  >
  > *To handle this without downtime, we deployed three backend container replicas behind an Nginx load balancer."*

---

### [0:30 – 1:00] Round-Robin Distribution & Apache Bench Load Testing (Q1.a & Q1.b)
- **What to Show on Screen**: 
  - Run `bash scripts/load-test.sh` in the terminal.
  - Watch the round-robin requests alternate: `backend-1` -> `backend-2` -> `backend-3`.
  - Let the Apache Bench tests execute.
- **What to Say**:
  > *"Here, you can see Nginx actively balancing incoming traffic in round-robin fashion across `backend-1`, `backend-2`, and `backend-3`, with each instance querying our live Neon PostgreSQL database.*
  >
  > *Next, we ran Apache Bench sending 1,000 requests at concurrency 20. Comparing a single backend instance versus our 3-instance cluster:*
  > *Our throughput surged from **40.64 requests per second to 83.82 requests per second—an improvement of +106.2%**!*
  > *Simultaneously, average latency dropped by **51.5%, from 492 milliseconds down to 238 milliseconds** with zero failed requests."*

---

### [1:00 – 1:30] Chaos Engineering: Zero-Downtime Nginx Failover (Q1.c)
- **What to Show on Screen**: 
  - Run `bash scripts/chaos-failover-test.sh` or run `ab` while stopping `repairgraph-backend-2` (`docker stop repairgraph-backend-2`).
  - Highlight the terminal output showing `Failed requests: 0`.
- **What to Say**:
  > *"Now for high availability. In our chaos test, we abruptly killed `repairgraph-backend-2` mid-flight during an active 1,000-request benchmark.*
  >
  > *Under default Nginx configuration, this resulted in dropped connections and HTTP 502 errors. However, by tuning Nginx with `proxy_next_upstream error timeout invalid_header http_500 http_502 http_503` and setting `proxy_next_upstream_tries 3`, Nginx instantly detects the broken TCP socket in under 1 millisecond and transparently replays the request to the remaining healthy containers.*
  >
  > *As shown in the output, **all 1,000 requests completed with 0 failed requests**, achieving true 100% zero downtime."*

---

### [1:30 – 2:00] Architecture Diagram, Cloud Bursting & Fog Computing (Q1.d)
- **What to Show on Screen**: 
  - Switch to the architecture diagram (`docs/da3-architecture-diagram.svg`).
  - Point your mouse cursor to the violet **Cloud Bursting** box and amber **Edge/Fog** box.
- **What to Say**:
  > *"Here is our complete system architecture: our Next.js frontend, Nginx load balancer on port 8080, three Docker containers on ports 3001, 3002, and 3003, our Neon cloud database with PgBouncer, and our Vercel hosting platform from Assignment 1.*
  >
  > *Highlighted in violet is our **Cloud Bursting component**: when request queue depth exceeds 80%, traffic automatically bursts into ephemeral Vercel Serverless Functions to absorb the disaster surge without 24/7 server costs.*
  >
  > *Highlighted in amber is our **Edge/Fog Computing component**: these are offline Rapid Triage Kiosks at physical repair centers that parse hardware symptoms and issue local QR passports even during power or internet outages, syncing to Neon DB once connection restores."*

---

### [2:00 – 2:30] Password Security (Bcrypt) & TOTP MFA + RBAC (Q2.a & Q2.b)
- **What to Show on Screen**: 
  - In terminal, run: `npx tsx scripts/verify-password-security.ts` followed by `npx tsx scripts/verify-rbac-totp.ts`.
- **What to Say**:
  > *"Turning to security: RepairGraph stores sensitive customer PII, device serial numbers, and repair invoices. In our Neon PostgreSQL database, all passwords are encrypted as salted bcrypt hashes with 10 rounds. Even with identical passwords, unique 22-character salts ensure completely different digests, eliminating rainbow table attacks.*
  >
  > *In Question 2.b, we implemented **TOTP multi-factor authentication** generating RFC 6238-compliant 6-digit rotating tokens for Google and Microsoft Authenticator.*
  >
  > *We also enforced Role-Based Access Control on Update and Delete APIs. As demonstrated in terminal:*
  > *- Unauthenticated requests are rejected with **HTTP 401 Unauthorized**.*
  > *- A standard consumer (`role: USER`) attempting deletion is rejected with **HTTP 403 Forbidden**.*
  > *- Only an elevated Fleet Supervisor (`role: ADMIN` with verified MFA) is granted access."*

---

### [2:30 – 3:00] Trivy Hardening, Threat Agents & Regulation (Q2.c & Q2.d)
- **What to Show on Screen**: 
  - Show the Trivy before-and-after table in `RepairGraph_DA3_Report.html` or run `docker images`.
- **What to Say**:
  > *"In Question 2.c, we scanned our container with **Aqua Security Trivy**.*
  > *Our baseline unhardened Debian image contained **506 vulnerabilities (24 CRITICAL and 482 HIGH)** and ran as root.*
  > *We hardened the container using a multi-stage Alpine 3.20 build, standalone Next.js pruning, and enforced an unprivileged non-root user (`nextjs`, UID 10001).*
  > *Rescanning with Trivy showed **zero OS vulnerabilities and dropped total vulnerabilities by 96.8% down to just 16**, while shrinking image size by **87.6% (from 2.94 GB to 364 MB)**.*
  >
  > *Finally, we addressed two domain threat agents: Rogue Technicians harvesting customer data—controlled via RBAC and TOTP MFA under **India's DPDPA 2023 Section 8(5) and GDPR Article 32**; and External Credential Stuffers—controlled via 10-round salted bcrypt hashes and hardened containers under the **E-Waste (Management) Rules, 2022**.*
  >
  > *All code, test scripts, and reports are committed to the `assignment-3` branch. Thank you!"*

---

