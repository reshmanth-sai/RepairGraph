# RepairGraph — BACSE344 DA3 Demo Video Script & Walkthrough Guide

**Course**: BACSE344 — Cloud Infrastructure and Architecture (C1 Slot)  
**Student Name**: Naidu Reshmanth Sai  
**Registration Number**: 25BCE1112  
**Faculty Evaluator**: Dr. P. Anandan (VIT Chennai)  
**Evaluation Target**: 10.0 / 10.0 Marks  
**Target Video Duration**: 2 Minutes 15 Seconds to 2 Minutes 50 Seconds (Under 3:00 Minutes Maximum)  
**Production URL**: https://repairgraph.vercel.app  
**Git Branch**: `assignment-3`  

---

## 1. Quick Teleprompter: Pure Continuous Speech

*Read this script naturally during your recording. Total spoken length: ~280 words (approx. 2 min 10 sec).*

> "Respected faculty Dr. P. Anandan, my name is **Naidu Reshmanth Sai**, registration number **25BCE1112**, C1 Slot. This is my DA3 demonstration for **RepairGraph**, our circular electronics repairability and e-waste passport platform.
>
> In our domain, the peak-demand event is the National EPR Compliance Reporting Surge. To absorb this surge, we orchestrated three container replicas behind an Nginx reverse proxy on port 8080. As shown on screen, sequential requests distribute evenly across all three backend containers with zero dropped connections.
>
> For Question 1.b, we benchmarked 1,000 requests at concurrency 20 against our database-heavy diagnostic triage route. Without load balancing on a single instance, throughput was **40.64 requests per second** at **492 milliseconds** mean latency. With our three-instance Nginx cluster, throughput surged by **106% to 83.82 requests per second**, and mean latency was cut in half down to **238 milliseconds**.
>
> In Question 1.c, we injected a chaos failure by abruptly terminating container `backend-2` mid-flight. Under default Nginx settings without retries, connections dropped immediately, producing **68 HTTP 502 Bad Gateway errors** and degrading availability to 93%. With our tuned `proxy_next_upstream` retry logic, Nginx detected the severed socket in under one millisecond and transparently replayed requests to healthy nodes—achieving **zero failed requests and 100% continuous uptime**.
>
> Addressing Question 1.d: on screen is our deployed architecture using Next.js, Nginx, and managed Neon PostgreSQL. To handle extreme spikes, we proposed two extensions: in violet, **Cloud Bursting** to ephemeral serverless containers when queues exceed 80%; and in amber, **On-Premise Fog Kiosks** for repair workshops to triage hardware offline with zero latency.
>
> Turning to security: in Question 2.a, user passwords use **10-round salted bcrypt**, generating unique 22-character salts that mathematically neutralize rainbow table attacks. In Question 2.b, we implemented **RFC 6238 TOTP MFA**. On screen is our live `/mfa` portal with rotating 6-digit codes. Our role-based access control strictly rejects unauthenticated calls with **HTTP 401** and unauthorized deletions with **HTTP 403**, authorizing only admins with verified MFA.
>
> In Question 2.c, Aqua Security Trivy revealed 506 CVEs in the baseline Debian image. Our hardened multi-stage Alpine build eliminated **100% of OS vulnerabilities**, reduced total CVEs by **96.8% down to 16**, and shrank image size from **2.94 GB down to 364 MB** under an unprivileged non-root user. Finally, our threat model safeguards technician records under **India's DPDPA 2023** and **GDPR Article 32**, and protects recycling certificates under the **E-Waste Rules 2022**.
>
> Everything is committed to branch `assignment-3`. Thank you!"

---

## 2. Pre-Recording Window Setup

Split your monitor into two halves:

### Left Half: Terminal Window
* **Directory**: `/Users/sai/RepairGraph` on branch `assignment-3`
* **Font Size**: 16pt (high contrast, easy to read on 1080p recording)
* **Pre-run check**: Run `docker compose ps` to ensure containers are active.

### Right Half: Web Browser (Chrome)
Keep the following tabs open and ordered from left to right:
* **Tab 1: Live Production App**: `https://repairgraph.vercel.app`
* **Tab 2: Architecture Diagram**: `docs/da3_screenshots/q1d_architecture_diagram.png` (or Page 5 of `RepairGraph_DA3_Report.pdf`)
* **Tab 3: Live MFA Web Portal**: `http://localhost:8080/mfa` (Showing QR Code & 6-digit input form)
* **Tab 4: Generated PDF Report**: `RepairGraph_DA3_Report.pdf` (Open to Page 2 Rubric Matrix or Page 13 Trivy Table)

---

## 3. Second-by-Second Execution Guide

### Scene 1 [0:00 – 0:25]: Introduction & Multi-Instance Cluster (Q1.a)
* **Screen**: Terminal
* **Actions**:
  ```bash
  docker compose ps
  for i in {1..6}; do curl -s http://localhost:8080/api/health | jq .data.instance; done
  ```
* **Verify**: Alternating output across `backend-1`, `backend-2`, and `backend-3`.

---

### Scene 2 [0:25 – 0:55]: Scalability Benchmarking (Q1.b)
* **Screen**: Terminal
* **Actions**:
  ```bash
  bash scripts/load-test.sh
  ```
* **Verify**: Throughput comparison table appears (40.64 RPS $\rightarrow$ 83.82 RPS, 492ms $\rightarrow$ 238ms).

---

### Scene 3 [0:55 – 1:30]: Chaos Failover & Zero Downtime (Q1.c)
* **Screen**: Terminal
* **Actions**:
  ```bash
  bash scripts/chaos-failover-test.sh
  ```
* **Verify**: Phase 1 records 68 failures; Phase 2 records 0 failures (100% uptime).

---

### Scene 4 [1:30 – 1:55]: System Architecture & Proposed Extensions (Q1.d)
* **Screen**: Switch to Browser Tab 2 (`q1d_architecture_diagram.png`)
* **Actions**: Point cursor to Violet (Cloud Bursting) and Amber (Edge Fog Triage Kiosks).

---

### Scene 5 [1:55 – 2:25]: Bcrypt, TOTP MFA & Granular RBAC (Q2.a & Q2.b)
* **Screen**: Terminal $\rightarrow$ Switch to Browser Tab 3 (`http://localhost:8080/mfa`)
* **Actions in Terminal**:
  ```bash
  npx tsx scripts/verify-password-security.ts
  npx tsx scripts/verify-rbac-totp.ts
  ```
* **Actions in Browser**: Show live `/mfa` portal with scannable QR code and 6-digit input form.

---

### Scene 6 [2:25 – 2:50]: Trivy Hardening, Threat Analysis & Conclusion (Q2.c & Q2.d)
* **Screen**: Terminal $\rightarrow$ Browser Tab 4 (PDF Report)
* **Actions in Terminal**:
  ```bash
  docker images | grep repairgraph
  ```
* **Actions in Browser**: Show Table 6 (Trivy Scan: 506 $\rightarrow$ 16 CVEs) and Table 7 (Threat Agent Matrix).
* **Finish**: Conclude cleanly at ~2:50.

---

## 4. Quick Terminal Command Reference

```bash
# 1. Check Docker cluster
docker compose ps

# 2. Check Round Robin distribution
for i in {1..6}; do curl -s http://localhost:8080/api/health | jq .data.instance; done

# 3. Run comparative load test
bash scripts/load-test.sh

# 4. Run chaos failover test
bash scripts/chaos-failover-test.sh

# 5. Run password and MFA/RBAC verifications
npx tsx scripts/verify-password-security.ts
npx tsx scripts/verify-rbac-totp.ts

# 6. Check hardened image size
docker images | grep repairgraph
```
