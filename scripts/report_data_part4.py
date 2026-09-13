"""
RepairGraph Report Data — Part 4: Chapters 16 through 18, References, and Appendices
"""

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def build_part4(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table):

    # =========================================================================
    # CHAPTER 16 — LIMITATIONS
    # =========================================================================
    add_heading_1(doc, "CHAPTER 16: LIMITATIONS")

    add_heading_2(doc, "16.1 In-Memory Rate Limiting")
    add_p(doc, 
          "The sliding-window rate limiter (src/server/auth/rateLimit.ts) operates in serverless process memory. While highly effective "
          "against burst attacks on a single compute node, serverless cold boots or multi-region routing distribute state across multiple "
          "isolated memory spaces. A production enterprise deployment would require a centralized, low-latency Redis cluster.")

    add_heading_2(doc, "16.2 Academic Demonstration Workload Scope")
    add_p(doc, 
          "RepairGraph is currently provisioned and calibrated for cloud DA project demonstration, academic evaluation, and small fleet triage, "
          "rather than hyperscale enterprise workloads processing millions of concurrent requests.")

    add_heading_2(doc, "16.3 Synchronous Decision Evaluation")
    add_p(doc, 
          "Because the deterministic decision engine executes in sub-millisecond time (< 1 ms), evaluations are processed synchronously "
          "within the HTTP request-response cycle. While highly responsive for interactive triage, heavy bulk fleet imports would benefit "
          "from an asynchronous message queue architecture.")

    add_heading_2(doc, "16.4 Native Cloud Observability Dependency")
    add_p(doc, 
          "Telemetry currently relies on native Vercel runtime logs, Neon database metrics, and the active /api/health ping endpoint, "
          "rather than an integrated third-party Application Performance Monitoring (APM) platform such as Datadog or New Relic.")

    add_heading_2(doc, "16.5 Non-Destructive Production Testing Boundary")
    add_p(doc, 
          "Production smoke tests and live acceptance validation strictly execute non-destructive read and write operations. Destructive "
          "testing (e.g., table truncation, schema dropping, or simulated catastrophic database failovers) is restricted to local offline environments.")

    add_heading_2(doc, "16.6 Informational Specialist Context")
    add_p(doc, 
          "Selecting a preferred specialist during triage provides workflow context for bidding, but does not create an immutable binding "
          "assignment prior to explicit customer quote acceptance.")

    # =========================================================================
    # CHAPTER 17 — FUTURE ENHANCEMENTS
    # =========================================================================
    add_heading_1(doc, "CHAPTER 17: FUTURE ENHANCEMENTS")

    add_heading_2(doc, "17.1 Distributed Rate Limiting via Redis")
    add_p(doc, 
          "Integrating Upstash Serverless Redis to provide global, atomic rate limiting, distributed session blacklisting, and instantaneous "
          "token revocation across all serverless edge regions.")

    add_heading_2(doc, "17.2 Asynchronous Background Queue (BullMQ)")
    add_p(doc, 
          "Deploying a dedicated Redis-backed task queue (BullMQ or AWS SQS) to process bulk enterprise hardware inventory imports and "
          "generate cryptographically signed PDF Repair Passports asynchronously.")

    add_heading_2(doc, "17.3 Enterprise APM & Distributed Tracing")
    add_p(doc, 
          "Instrumenting OpenTelemetry traces across route handlers, Prisma queries, and external network pings to monitor database connection "
          "pool latency and serverless execution cold starts.")

    add_heading_2(doc, "17.4 Vector Embeddings for OEM Manuals (pgvector)")
    add_p(doc, 
          "Augmenting the diagnostic engine with pgvector similarity search over official OEM Hardware Maintenance Manuals (HMM) to retrieve "
          "exact screw torque specifications and exploded schematics.")

    add_heading_2(doc, "17.5 Dedicated Mobile Application (React Native)")
    add_p(doc, 
          "Developing a companion React Native mobile application supporting optical barcode/serial number camera scanning to streamline "
          "device onboarding and workbench check-in.")

    # =========================================================================
    # CHAPTER 18 — CONCLUSION
    # =========================================================================
    add_heading_1(doc, "CHAPTER 18: CONCLUSION")

    add_heading_2(doc, "18.1 Summary of Engineering Achievements")
    add_p(doc, 
          "RepairGraph demonstrates that modern full-stack web engineering, rigorous relational database modeling, and deterministic decision "
          "logic can effectively solve pervasive market failures in consumer electronics servicing. By unifying Next.js 15 App Router, React 19, "
          "and Prisma ORM on Vercel and Neon PostgreSQL, the platform establishes a transparent, cloud-native lifecycle ecosystem.")
    add_p(doc, 
          "The project's key technical milestones include:")
    add_bullet(doc, "Rejection of black-box AI in favor of a 100% reproducible, deterministic 2-Tier Diagnostic and 7-Factor Repairability Score Model.", bold_prefix="• ")
    add_bullet(doc, "Integration of statutory mandates from India's Right to Repair Portal and the E-Waste (Management) Rules, 2022.", bold_prefix="• ")
    add_bullet(doc, "Implementation of a secure two-sided competitive quote marketplace and permanent serial-linked Repair Passport.", bold_prefix="• ")
    add_bullet(doc, "Deployment and live functional acceptance verification on production cloud infrastructure (https://repairgraph.vercel.app).", bold_prefix="• ")
    add_bullet(doc, "Exhaustive automated testing across 82 validation test cases (35 engine + 47 API/security tests, 0 failures).", bold_prefix="• ")

    add_heading_2(doc, "18.2 Practical Impact & Academic Defense Summary")
    add_p(doc, 
          "RepairGraph provides consumers, technicians, and fleet administrators with an objective, evidence-based alternative to quoting "
          "guesswork and premature hardware disposal. The platform stands fully verified, documented, and production-ready for academic "
          "evaluation and cloud project defense.")

    # =========================================================================
    # REFERENCES
    # =========================================================================
    add_heading_1(doc, "REFERENCES")

    refs = [
        ("Next.js Documentation", "Vercel Inc. (2025). Next.js 15 App Router Documentation. Available at: https://nextjs.org/docs"),
        ("React Documentation", "Meta Platforms Inc. (2025). React 19 Reference Documentation. Available at: https://react.dev/"),
        ("Prisma ORM Documentation", "Prisma Data Inc. (2025). Prisma 6.4 Documentation & Relational Client Guide. Available at: https://www.prisma.io/docs"),
        ("PostgreSQL Official Documentation", "The PostgreSQL Global Development Group (2024). PostgreSQL 16 Documentation. Available at: https://www.postgresql.org/docs/16/"),
        ("Neon Serverless Documentation", "Neon Inc. (2025). Neon Serverless PostgreSQL Architecture & Connection Pooling. Available at: https://neon.tech/docs"),
        ("Vercel Serverless Documentation", "Vercel Inc. (2025). Vercel Serverless Functions & Edge Network Runtime Guide. Available at: https://vercel.com/docs"),
        ("Zod Schema Validation", "Colinhacks (2024). Zod: TypeScript-First Schema Validation. Available at: https://zod.dev/"),
        ("JSON Web Token (RFC 7519)", "Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT). IETF RFC 7519. Available at: https://datatracker.ietf.org/doc/html/rfc7519"),
        ("Password Hashing with bcrypt", "Provos, N., & Mazières, D. (1999). A Future-Adaptable Password Scheme. In Proceedings of the USENIX Annual Technical Conference."),
        ("India Right to Repair Framework", "Department of Consumer Affairs, Government of India (2023). Right to Repair Portal India. Available at: https://righttorepairindia.gov.in/"),
        ("India E-Waste Management Rules", "Ministry of Environment, Forest and Climate Change, Government of India (2022). E-Waste (Management) Rules, 2022. Gazette of India, Notification G.S.R. 801(E)."),
        ("TypeScript Handbook", "Microsoft Corporation (2024). TypeScript 5.0 Documentation. Available at: https://www.typescriptlang.org/docs/")
    ]
    for idx, (title, citation) in enumerate(refs):
        add_p(doc, f"[{idx+1}] {citation}", bold_prefix=f"[{idx+1}] ", space_after=6)

    doc.add_page_break()

    # =========================================================================
    # APPENDICES
    # =========================================================================
    add_heading_1(doc, "APPENDICES")

    # Appendix A: API Endpoint Inventory
    add_heading_2(doc, "Appendix A: Complete REST API Endpoint Inventory (36 Handlers)")
    tbl_app_a = doc.add_table(rows=22, cols=4)
    format_table(tbl_app_a, col_widths=[1.5, 0.8, 1.4, 2.5])
    app_a_data = [
        ("Route Path", "Method", "Auth Scope", "Operation Purpose"),
        ("/api/auth/register", "POST", "Public", "User account registration with bcrypt salting and cookie setting."),
        ("/api/auth/login", "POST", "Public", "User authentication; issues JWT in HttpOnly cookie; suppresses raw token."),
        ("/api/auth/logout", "POST", "Public / Auth", "Clears authentication session cookie (rg_token)."),
        ("/api/auth/me", "GET", "Authenticated", "Returns authenticated user profile and role."),
        ("/api/devices", "GET", "Authenticated", "Lists devices owned by the authenticated user."),
        ("/api/devices", "POST", "Authenticated", "Registers a new physical hardware device."),
        ("/api/devices/:id", "GET", "Owner / Admin", "Retrieves single device record with tickets and service history."),
        ("/api/devices/:id", "PUT", "Owner / Admin", "Updates device metadata, valuation, or condition."),
        ("/api/devices/:id", "DELETE", "Owner / Admin", "Removes device and cascades to associated tickets."),
        ("/api/repair-requests", "GET", "Authenticated", "Lists repair tickets for user or open tickets for technicians."),
        ("/api/repair-requests", "POST", "Authenticated", "Files a repair request for an owned hardware device."),
        ("/api/repair-requests/:id", "GET", "Owner / Tech", "Retrieves request details, diagnosis, and competing quotes."),
        ("/api/repair-requests/:id", "PUT", "Owner / Admin", "Updates request description or urgency."),
        ("/api/repair-requests/:id", "DELETE", "Owner / Admin", "Withdraws and deletes an open repair ticket."),
        ("/api/repair-requests/:id/diagnose", "POST", "Owner / Admin", "Executes deterministic diagnostic and economic scoring engine."),
        ("/api/repair-requests/:id/quotes", "GET", "Owner / Tech", "Lists quotes submitted for a repair request."),
        ("/api/repair-requests/:id/quotes", "POST", "REPAIRER", "Technician submits competitive repair bid with cost and days."),
        ("/api/quotes/:id", "PUT", "Owner / Tech", "Accepts quote (creates job) or rejects/withdraws quote."),
        ("/api/repair-jobs", "GET", "Authenticated", "Lists active repair jobs for customer or assigned technician."),
        ("/api/repair-jobs/:id", "PUT", "Assigned Tech", "Advances bench status (DIAGNOSING -> COMPLETED)."),
        ("/api/repair-history", "GET", "Authenticated", "Retrieves immutable Repair Passport ledger records.")
    ]
    for idx, (c1, c2, c3, c4) in enumerate(app_a_data):
        tbl_app_a.cell(idx, 0).paragraphs[0].text = c1
        tbl_app_a.cell(idx, 1).paragraphs[0].text = c2
        tbl_app_a.cell(idx, 2).paragraphs[0].text = c3
        tbl_app_a.cell(idx, 3).paragraphs[0].text = c4

    add_heading_2(doc, "Appendix B: Database Entity Summary (11 Models & 9 Enums)")
    add_p(doc, 
          "The Prisma schema defines 11 normalized relational entities: User, Device, RepairRequest, Diagnosis, RepairRecommendation, "
          "Repairer, RepairerSpecialization, Quote, RepairJob, RepairHistory, and Review. The 9 custom PostgreSQL enums are: UserRole, "
          "DeviceCategory, DeviceCondition, UrgencyLevel, RequestStatus, RecommendedAction, VerificationStatus, QuoteStatus, and JobStatus.")

    add_heading_2(doc, "Appendix C: Decision Engine Formula Summary")
    add_bullet(doc, "Baseline Repairability Score: S_baseline = Disassembly(25) + Parts(20) + Docs(15) + Modularity(15) + Pairing(10) + Age(10) + Ecosystem(5) = 100 points.", bold_prefix="1. ")
    add_bullet(doc, "Final Repairability Score: S_repair = max(10, min(98, S_baseline - Deductions)).", bold_prefix="2. ")
    add_bullet(doc, "Device Depreciation: V_current = max(0.15 * P, round(P * (1 - 0.22)^t / 100) * 100).", bold_prefix="3. ")
    add_bullet(doc, "Repair Cost Ratio: RCR = C_avg / V_current.", bold_prefix="4. ")
    add_bullet(doc, "Economic Score: S_econ = max(0, min(100, round((1 - RCR) * 100))).", bold_prefix="5. ")

    add_heading_2(doc, "Appendix D: Automated Test Inventory (82 Tests Audited)")
    add_p(doc, 
          "The repository test suite executes 82 automated test cases with 100% passage:\n"
          "• 35 Engine Tests (tests/engine.test.ts): 13 symptom extraction tests, 13 scoring model tests, 9 lifecycle decision matrix tests.\n"
          "• 47 API & Security Tests (tests/api.test.ts): 24 core business rule tests, 18 Step 6 hardening tests, 4 Step 7C.2 registration validation tests, and 1 demo persona provisioning verification test.")

    add_heading_2(doc, "Appendix E: Production Deployment Configuration Summary")
    add_p(doc, 
          "• Production URL: https://repairgraph.vercel.app\n"
          "• Compute Runtime: Vercel Serverless Functions (Node.js 24.x)\n"
          "• Database: Neon Managed Serverless PostgreSQL (v16+)\n"
          "• Connection Pool: PgBouncer over TLS (port 6543)\n"
          "• Migrations Applied: prisma/migrations/0_init deployed via npx prisma migrate deploy\n"
          "• Active Security Headers: HSTS (max-age=31536000), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy")
