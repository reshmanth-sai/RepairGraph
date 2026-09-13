"""
RepairGraph Report Data — Part 3: Chapters 11 through 15
"""

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def build_part3(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table):

    # =========================================================================
    # CHAPTER 11 — USER WORKFLOW
    # =========================================================================
    add_heading_1(doc, "CHAPTER 11: USER WORKFLOW")

    add_heading_2(doc, "11.1 Primary Consumer Repair Journey")
    add_p(doc, 
          "The core consumer workflow guides a device owner through an end-to-end evidence-based lifecycle: from hardware onboarding "
          "to completed bench servicing and passport stamping. Figure 5 depicts the sequence of operational states.")
    
    add_figure_image(doc, "docs/report_assets/figure5_marketplace_workflow.png", "Figure 5: Competitive Repair Marketplace & Lifecycle Workflow")

    add_bullet(doc, "Stage 1 — Onboarding & Cataloging: User creates an account, logs in securely, and catalogs physical hardware (brand, model, serial, purchase price, date).", bold_prefix="1. ")
    add_bullet(doc, "Stage 2 — Symptom Filing & Triage: Owner submits observed issues. The deterministic engine extracts failure modes, assesses safety hazards, and computes the 7-factor repairability score and RCR.", bold_prefix="2. ")
    add_bullet(doc, "Stage 3 — Marketplace Discovery: The ticket is published to the marketplace. Verified technicians inspect triage findings and submit competitive pricing and turnaround bids.", bold_prefix="3. ")
    add_bullet(doc, "Stage 4 — Quote Acceptance: Owner evaluates competing bids based on cost, turnaround, and technician rating, accepting the optimal bid and transitioning the ticket to an active RepairJob.", bold_prefix="4. ")
    add_bullet(doc, "Stage 5 — Bench Execution: Assigned technician advances the hardware through standardized milestones: Diagnosing -> Parts Waiting -> Repairing -> Testing.", bold_prefix="5. ")
    add_bullet(doc, "Stage 6 — Completion & Passport Stamping: Upon final bench handover, the system immutably records parts replaced, costs, and technician signatures into the permanent Repair Passport.", bold_prefix="6. ")

    add_heading_2(doc, "11.2 Technician Quoting & Workbench Stepper")
    add_p(doc, 
          "Technicians access a specialized Workbench interface displaying incoming open requests matching their registered competencies. "
          "The workbench enforces authorization barriers: unverified technicians cannot quote, technicians cannot quote on their own hardware, "
          "and only the assigned specialist can advance bench milestones.")

    add_heading_2(doc, "11.3 Alternative Lifecycle Paths")
    add_bullet(doc, "DIY Path: Triggered when components are modular (e.g., Framework battery) and RCR <= 0.28. Directs user to public step-by-step disassembly guides.", bold_prefix="• ")
    add_bullet(doc, "Resell / Trade-In Path: Triggered when repair expenses approach marginal utility (0.50 < RCR <= 0.75). Recommends trade-in or parts salvage.", bold_prefix="• ")
    add_bullet(doc, "Replace Path: Triggered for aging (>6 years) or uneconomical (RCR > 0.75) hardware. Recommends capital reallocation to modern hardware.", bold_prefix="• ")
    add_bullet(doc, "Recycle Path (E-Waste Compliance): Triggered upon catastrophic failure (liquid + power failure or RCR > 0.92). Channels device to EPR-authorized recyclers under India's E-Waste Rules 2022.", bold_prefix="• ")

    # =========================================================================
    # CHAPTER 12 — IMPLEMENTATION ARCHITECTURE
    # =========================================================================
    add_heading_1(doc, "CHAPTER 12: IMPLEMENTATION ARCHITECTURE")

    add_heading_2(doc, "12.1 Project Directory Organization")
    add_p(doc, 
          "The codebase adheres to Next.js 15 App Router standards, structured into distinct architectural layers:")
    add_bullet(doc, "src/app/*: Next.js App Router presentation layer, layout trees, page views, and API route handlers.", bold_prefix="• ")
    add_bullet(doc, "src/app/api/*: 21 Next.js route handler files (route.ts) serving 36 REST operations.", bold_prefix="• ")
    add_bullet(doc, "src/server/services/*: Domain business services encapsulating state transitions and transactional operations.", bold_prefix="• ")
    add_bullet(doc, "src/server/engine/*: Pure deterministic diagnostic, scoring, and economic decision engine modules.", bold_prefix="• ")
    add_bullet(doc, "src/server/auth/*: Cryptographic utilities, JWT signers, cookie extractors, and sliding-window rate limiters.", bold_prefix="• ")
    add_bullet(doc, "prisma/*: Declarative Prisma schema (schema.prisma), baseline migration SQL, and seed scripts.", bold_prefix="• ")
    add_bullet(doc, "tests/*: Automated test suites covering engine unit tests (engine.test.ts) and API integration tests (api.test.ts).", bold_prefix="• ")

    add_heading_2(doc, "12.2 Layered Backend Architecture")
    add_p(doc, 
          "Backend execution follows strict separation of concerns: Route Handlers handle HTTP serialization and error wrapping; Zod schemas "
          "enforce input types; Services coordinate business invariants; the Engine computes scores; and Prisma Client mediates SQL execution.")

    add_heading_2(doc, "12.3 Database Singleton Pattern")
    add_p(doc, 
          "To prevent connection pool exhaustion during development hot-reloading and serverless invocation, Prisma Client is instantiated "
          "via a global singleton pattern in src/server/db.ts, attaching the client instance to globalThis in non-production environments.")

    # =========================================================================
    # CHAPTER 13 — TESTING AND VALIDATION
    # =========================================================================
    add_heading_1(doc, "CHAPTER 13: TESTING AND VALIDATION")

    add_heading_2(doc, "13.1 Comprehensive Testing Strategy")
    add_p(doc, 
          "RepairGraph implements a multi-tiered quality assurance strategy spanning unit testing, integration testing, static code analysis, "
          "and live cloud acceptance validation.")

    add_heading_2(doc, "13.2 Unit Testing: Diagnostic & Decision Engine")
    add_p(doc, 
          "The engine test suite (tests/engine.test.ts) executes 35 automated unit tests across three suites:")
    add_bullet(doc, "Suite 1: Symptom & Feature Extraction (13 tests): Validates component categorization, word-boundary regex parsing, liquid ingress detection, lithium swelling hazard flags, and modular DIY feasibility.", bold_prefix="• ")
    add_bullet(doc, "Suite 2: 7-Factor Score Model & Economic Math (13 tests): Validates that factor weights sum to 100, disassembly benchmarks match specs, cost ranges are positive, and RCR math scales accurately.", bold_prefix="• ")
    add_bullet(doc, "Suite 3: Statutory Lifecycle Decision Matrix (9 tests): Validates actionable verdicts (DIY, REPAIR, RESELL, REPLACE, RECYCLE), catastrophic liquid/power rules, and E-Waste Rules 2022 citations.", bold_prefix="• ")

    add_heading_2(doc, "13.3 Integration Testing: Backend & Security")
    add_p(doc, 
          "The API test suite (tests/api.test.ts) executes 47 automated integration tests validating auth flows, bcrypt verification, "
          "sliding-window rate limiting, device ownership boundaries, workbench state stepper transitions, review uniqueness, and "
          "strict error sanitization suppressing Prisma internals.")

    add_heading_2(doc, "13.4 Total Automated Test Audit")
    add_p(doc, "Table 12 presents the audited automated test counts, confirming 100% test passage.")

    tbl_test = doc.add_table(rows=5, cols=4)
    format_table(tbl_test, col_widths=[2.2, 1.4, 1.4, 1.2])
    test_summary = [
        ("Test Suite Category", "Executable Command", "Tests Executed", "Result"),
        ("Diagnostic Decision Engine", "npx tsx tests/engine.test.ts", "35 Tests", "35 Passed, 0 Failed"),
        ("Backend & Business Rules", "npx tsx tests/api.test.ts", "47 Tests", "47 Passed, 0 Failed"),
        ("Combined Test Suite", "npm test", "82 Tests Total", "82 Passed, 0 Failed"),
        ("Static Linting Analysis", "npm run lint", "Full Codebase", "0 Errors, 0 Warnings")
    ]
    for idx, (c1, c2, c3, c4) in enumerate(test_summary):
        tbl_test.cell(idx, 0).paragraphs[0].text = c1
        tbl_test.cell(idx, 1).paragraphs[0].text = c2
        tbl_test.cell(idx, 2).paragraphs[0].text = c3
        tbl_test.cell(idx, 3).paragraphs[0].text = c4

    add_heading_2(doc, "13.5 Production End-to-End Acceptance Validation")
    add_p(doc, 
          "In Phase 7C.3, a live end-to-end acceptance validation was executed against the production deployment at "
          "https://repairgraph.vercel.app. Table 13 summarizes the verified production milestones.")

    tbl_prod_test = doc.add_table(rows=7, cols=3)
    format_table(tbl_prod_test, col_widths=[1.5, 2.2, 2.5])
    prod_test_data = [
        ("Validation Stage", "Live Endpoint Verified", "Observed Production Outcome"),
        ("1. Health Check", "GET /api/health", "HTTP 200, status: ok, database: connected, measured latency."),
        ("2. Security Headers", "HEAD /api/health", "HSTS max-age=31536000, X-Frame-Options: DENY, nosniff present."),
        ("3. Registration", "POST /api/auth/register", "Account created, bcrypt hashed, HttpOnly rg_token cookie set."),
        ("4. Login & Auth", "POST /api/auth/login", "Authenticated session established; raw JWT suppressed from body."),
        ("5. Device & Triage", "POST /api/devices, /diagnose", "Hardware registered; deterministic 7-factor scoring evaluated."),
        ("6. Session Persistence", "POST /api/auth/logout, /login", "Logged out, re-authenticated; device and diagnostic data intact.")
    ]
    for idx, (c1, c2, c3) in enumerate(prod_test_data):
        tbl_prod_test.cell(idx, 0).paragraphs[0].text = c1
        tbl_prod_test.cell(idx, 1).paragraphs[0].text = c2
        tbl_prod_test.cell(idx, 2).paragraphs[0].text = c3

    # =========================================================================
    # CHAPTER 14 — CLOUD DEPLOYMENT
    # =========================================================================
    add_heading_1(doc, "CHAPTER 14: CLOUD DEPLOYMENT")

    add_heading_2(doc, "14.1 Production Cloud Architecture")
    add_p(doc, 
          "RepairGraph is deployed to production using a two-tier cloud architecture: Vercel Serverless Platform for application "
          "compute and Edge CDN delivery, paired with Neon Managed Cloud PostgreSQL for relational storage. Figure 6 illustrates "
          "the network and deployment topology.")
    
    add_figure_image(doc, "docs/report_assets/figure6_deployment_topology.png", "Figure 6: Production Cloud Deployment & Network Security Topology")

    add_heading_2(doc, "14.2 Vercel Serverless Runtime (Node.js 24.x)")
    add_p(doc, 
          "The Next.js application executes within Vercel Serverless Functions on the Node.js 24.x runtime. Static assets and cached "
          "routes are served via Vercel's global Anycast Edge Network with automated TLS 1.3 termination. Crucially, the application code "
          "executes in full Node.js serverless containers (not restricted V8 Edge isolates), providing complete compatibility with Prisma ORM, "
          "bcrypt, and native Node crypto libraries.")

    add_heading_2(doc, "14.3 Managed Neon Serverless PostgreSQL")
    add_p(doc, 
          "Persistent relational data is hosted on Neon Serverless PostgreSQL (v16+). Application queries connect via pooled TLS "
          "(DATABASE_URL) backed by PgBouncer, preventing connection saturation during concurrent serverless invocations. Database "
          "migrations utilize direct connections (DIRECT_URL) via port 5432.")

    add_heading_2(doc, "14.4 Environment Configuration & Secrets")
    add_p(doc, "Table 14 catalogs the environment variable names used across runtime environments (values omitted for security).")

    tbl_env = doc.add_table(rows=8, cols=3)
    format_table(tbl_env, col_widths=[1.8, 1.4, 3.0])
    env_data = [
        ("Variable Name", "Sensitivity Scope", "Functional Purpose"),
        ("DATABASE_URL", "Server Secret", "Pooled PostgreSQL connection string for Prisma application queries."),
        ("DIRECT_URL", "Server Secret", "Direct PostgreSQL connection string for deploying Prisma migrations."),
        ("JWT_SECRET", "Server Secret", "256-bit cryptographic key for HMAC-SHA256 session token signing."),
        ("JWT_EXPIRES_IN", "Server Config", "Token validity duration string (default: 7d)."),
        ("PORT", "Server Config", "Local execution port (default: 3000)."),
        ("NODE_ENV", "Server Config", "Runtime environment (development, test, production)."),
        ("NEXT_PUBLIC_APP_URL", "Public Config", "Canonical public URL (https://repairgraph.vercel.app).")
    ]
    for idx, (c1, c2, c3) in enumerate(env_data):
        tbl_env.cell(idx, 0).paragraphs[0].text = c1
        tbl_env.cell(idx, 1).paragraphs[0].text = c2
        tbl_env.cell(idx, 2).paragraphs[0].text = c3

    add_heading_2(doc, "14.5 Production Deployment Runbook")
    add_bullet(doc, "Step 1: Provision serverless PostgreSQL on Neon and obtain pooled (6543) and direct (5432) connection strings.", bold_prefix="1. ")
    add_bullet(doc, "Step 2: Configure production environment secrets in Vercel project dashboard.", bold_prefix="2. ")
    add_bullet(doc, "Step 3: Deploy declarative schema migrations using npx prisma migrate deploy (do not use db push in production).", bold_prefix="3. ")
    add_bullet(doc, "Step 4: Compile production bundle via prisma generate && next build --turbopack.", bold_prefix="4. ")
    add_bullet(doc, "Step 5: Verify production health via GET https://repairgraph.vercel.app/api/health.", bold_prefix="5. ")
    add_bullet(doc, "Step 6: Execute non-destructive smoke and functional acceptance tests.", bold_prefix="6. ")

    add_heading_2(doc, "14.6 Health Telemetry Endpoint (/api/health)")
    add_p(doc, 
          "The health route executes an active database ping query (SELECT 1) and returns real-time operational telemetry:")
    add_callout_box(doc, 
                    '{"success":true,"data":{"status":"ok","service":"RepairGraph API","database":"connected","latencyMs":3269,"uptime":3,"timestamp":"2026-09-12T16:10:04.310Z","environment":"production"}}', 
                    title="PRODUCTION HEALTH RESPONSE")

    add_heading_2(doc, "14.7 Free-Tier Cost Analysis")
    add_p(doc, 
          "RepairGraph leverages Vercel's personal hobby tier and Neon's free tier (0.5 GiB storage, shared vCPU). While suitable for "
          "academic evaluation and portfolio demonstration, the report notes that cloud providers may alter free-tier quotas, and "
          "no perpetual ₹0 cost is guaranteed.")

    # =========================================================================
    # CHAPTER 15 — RESULTS AND DISCUSSION
    # =========================================================================
    add_heading_1(doc, "CHAPTER 15: RESULTS AND DISCUSSION")

    add_heading_2(doc, "15.1 Qualitative Diagnostic Evaluation")
    add_p(doc, 
          "Validation across diverse hardware contexts demonstrated that the 7-Factor Model accurately reflects physical design "
          "realities: modular devices (Framework Laptop: 78/100) receive high repairability ratings and DIY feasibility, whereas heavily "
          "adhesive-bonded hardware (Apple MacBook: 48/100) incurs disassembly penalties and requires professional intervention. "
          "Incident hazard deductions reliably escalate acute risks (liquid ingress and swollen cells) to CRITICAL severity.")

    add_heading_2(doc, "15.2 Marketplace Efficiency Observations")
    add_p(doc, 
          "The two-sided quote marketplace eliminates quoting guesswork. Multi-quote comparisons empower consumers to evaluate bids "
          "against both turnaround time and technician verification ratings, while the atomic quote acceptance state machine prevents "
          "double-booking and guarantees that competing quotes are cleanly transitioned.")

    add_heading_2(doc, "15.3 Regulatory Alignment & E-Waste Impact")
    add_p(doc, 
          "By automatically generating CO2e manufacturing offsets and diverting e-waste mass estimates into the decision narrative, "
          "RepairGraph transforms abstract environmental regulations (India's E-Waste Rules 2022) into actionable consumer metrics.")

    doc.add_page_break()
