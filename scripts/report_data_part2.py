"""
RepairGraph Report Data — Part 2: Chapters 6 through 10
"""

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def build_part2(doc, add_p, add_bullet, add_heading_1, add_heading_2, add_heading_3, 
                add_figure_image, add_callout_box, format_table):
    
    # =========================================================================
    # CHAPTER 6 — FUNCTIONAL MODULES
    # =========================================================================
    add_heading_1(doc, "CHAPTER 6: FUNCTIONAL MODULES")
    add_p(doc, 
          "RepairGraph is structured into 15 cohesive functional modules that span user management, diagnostic intelligence, "
          "marketplace transactions, service ledgering, and administrative governance. Each module encapsulates clear functional "
          "boundaries, inputs, processing logic, outputs, and corresponding API/database interfaces.")

    modules = [
        ("6.1 User Authentication & Session Control",
         "Manages identity creation, password hashing, session issuance, and cookie invalidation.",
         "Name, email, plaintext password, role (USER/REPAIRER), optional phone.",
         "Validates schema with Zod; hashes password using bcrypt (10 rounds); checks email uniqueness; generates 7-day JWT; injects HttpOnly secure cookie.",
         "Sanitized User profile (id, name, email, role) and Set-Cookie header with rg_token.",
         "POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me; Prisma User model."),

        ("6.2 Hardware Device Catalog & Valuation",
         "Maintains user's personal hardware registry, tracking purchase metadata, physical condition, and dynamic market valuation.",
         "Category, brand, model, serial number, purchase date, purchase price, warranty expiry, condition.",
         "Enforces user ownership; calculates annual 22% depreciation curve if current value is omitted; validates positive price constraints.",
         "Persisted Device record with unique ID and calculated fair market valuation.",
         "GET/POST /api/devices, GET/PUT/DELETE /api/devices/:id; Prisma Device model."),

        ("6.3 Problem Reporting & Triage Initiation",
         "Allows device owners to file structured repair tickets describing observed failure modes and operational urgency.",
         "Device ID, symptom narrative description, urgency level (LOW/MEDIUM/HIGH).",
         "Verifies that the target device is owned by the authenticated user; checks for existing active requests; initializes RequestStatus.REQUESTED.",
         "Created RepairRequest ticket ready for diagnostic triage or technician quoting.",
         "GET/POST /api/repair-requests, GET/PUT/DELETE /api/repair-requests/:id; Prisma RepairRequest model."),

        ("6.4 Heuristic Symptom Extraction (Tier 1)",
         "Parses unstructured symptom text into structured diagnostic failure signals using token-boundary regex matching.",
         "Free-text description string (e.g., 'cracked glass and screen flickering after drop') and device category.",
         "Executes heuristic word-boundary matching across 8 component dictionaries; detects acute flags (liquid ingress, swollen battery); computes confidence percentage.",
         "DiagnosticSignals payload: primaryComponent, issueCategory, severity, confidence, flags.",
         "Invoked synchronously inside POST /api/repair-requests/:id/diagnose; purely in-memory engine computation."),

        ("6.5 Diagnostic Signal Synthesis",
         "Synthesizes raw symptom signals into a persistent database Diagnosis record linked to the active ticket.",
         "DiagnosticSignals object from symptom extractor.",
         "Maps extracted component to possible root-cause issue; bundles structured evidence bullet points into text array.",
         "Persisted Diagnosis entity with confidence rating and evidence strings.",
         "Prisma Diagnosis model (1:1 relation with RepairRequest)."),

        ("6.6 7-Factor Repairability Evaluation (Tier 2)",
         "Evaluates physical design repairability across 7 engineering dimensions, calibrated by brand and device category.",
         "Device category, brand, model, purchase date (age in years), diagnostic signals.",
         "Computes 7 weighted factors summing to 100; subtracts incident hazard penalties (liquid -20, power -10, logic board -15); bounds score [10, 98].",
         "Final repairability score (S_repair) and detailed factor score breakdown.",
         "Invoked in scoringEngine.ts; stored in Prisma RepairRecommendation model."),

        ("6.7 Fair-Market Economic Analysis",
         "Evaluates the financial viability of repairing the hardware relative to its depreciated residual value.",
         "Device purchase price, age in years, current market value, estimated component repair costs.",
         "Computes depreciated fair market value; queries brand-scaled component cost matrix; calculates Repair Cost Ratio (RCR = C_repair / V_current); computes Economic Score (100 - RCR*100).",
         "RCR value, economic score (0–100), estimated cost range (min/max).",
         "Invoked in scoringEngine.ts; stored in Prisma RepairRecommendation model."),

        ("6.8 Statutory Decision & Explanation Generation",
         "Synthesizes repairability score, economic score, and incident hazards into an actionable statutory lifecycle verdict.",
         "ScoringResult, DiagnosticSignals, and DeviceContext.",
         "Evaluates threshold rules for REPAIR, DIY, RESELL, REPLACE, or RECYCLE; composes multi-paragraph explainability citing carbon savings and India E-Waste Rules 2022.",
         "RecommendedAction enum and structured explanation narrative.",
         "POST /api/repair-requests/:id/diagnose; Prisma RepairRecommendation model."),

        ("6.9 Verified Repairer Directory & Geolocation",
         "Provides a searchable directory of verified independent technicians and commercial repair workshops.",
         "Filter parameters: device category, brand, verification status, search query.",
         "Queries verified Repairer profiles and associated RepairerSpecialization records; computes aggregate rating and completed job counts.",
         "Paginated array of verified workshops with address, coordinates, and specialization badges.",
         "GET /api/repairers, GET /api/repairers/:id; Prisma Repairer and RepairerSpecialization models."),

        ("6.10 Competitive Quote Marketplace",
         "Enables verified technicians to discover open repair tickets and submit competitive pricing and turnaround bids.",
         "Repair request ID, technician user ID, estimated cost, estimated turnaround days, technician notes.",
         "Verifies technician's REPAIRER role and active verification status; ensures technician does not quote on own ticket; prevents duplicate bids on same ticket.",
         "Created Quote record initialized to QuoteStatus.PENDING.",
         "GET/POST /api/repair-requests/:id/quotes; Prisma Quote model."),

        ("6.11 Quote Lifecycle & Acceptance State Machine",
         "Governs the customer's decision to accept or reject competing technician bids.",
         "Quote ID, decision action (ACCEPTED / REJECTED / WITHDRAWN).",
         "Verifies customer ownership of the ticket; atomic transaction marks selected quote ACCEPTED, creates active RepairJob, and transitions all competing quotes to REJECTED.",
         "Updated Quote record and newly instantiated RepairJob entity.",
         "PUT /api/quotes/:id; Prisma Quote, RepairRequest, and RepairJob models."),

        ("6.12 Repair Job Execution Stepper",
         "Manages the multi-stage bench execution workflow for accepted repair jobs.",
         "Job ID, target status (DIAGNOSING -> WAITING_FOR_PART -> REPAIRING -> TESTING -> COMPLETED), actual cost, technician bench notes.",
         "Verifies that only the assigned technician can update status; validates forward progression; upon COMPLETED, automatically commits RepairHistory record and increments technician totalJobs.",
         "Updated RepairJob entity with timestamp milestones and bench notes.",
         "GET/PUT /api/repair-jobs/:id, GET /api/repair-jobs; Prisma RepairJob model."),

        ("6.13 Standardized Repair Passport Ledger",
         "Maintains an immutable, tamper-evident maintenance ledger linked permanently to the physical device serial number.",
         "Completed RepairJob entity, parts replaced list, final cost, servicing technician ID.",
         "Instantiates immutable RepairHistory record upon job completion; provides tamper-evident audit trail for warranty and resale valuation.",
         "Permanent service record displaying parts replaced, date, cost, and technician credentials.",
         "GET /api/repair-history; Prisma RepairHistory model."),

        ("6.14 Post-Service Reviews & Rating Synthesis",
         "Allows customers to rate and review completed repair jobs, driving meritocratic technician reputation.",
         "Repair job ID, star rating (1–5), review comment.",
         "Verifies job is COMPLETED; verifies customer ownership; prevents duplicate reviews via unique constraint; recalculates technician average rating.",
         "Created Review record and updated Repairer aggregate rating.",
         "POST /api/reviews, GET /api/repairers/:id/reviews; Prisma Review and Repairer models."),

        ("6.15 Administrative & Seed Controls",
         "Provides platform governance, system health observability, and test persona database provisioning.",
         "Admin authentication session or seed trigger payload.",
         "Executes active database ping (SELECT 1); seeds default demonstration personas with pre-configured devices and quotes.",
         "Health telemetry JSON ({ status, database, latencyMs, uptime }) or seed success confirmation.",
         "GET /api/health, POST /api/seed; Prisma Client connection pool.")
    ]

    for title, purp, inp, proc, outp, intf in modules:
        add_heading_2(doc, title)
        add_p(doc, purp, bold_prefix="Purpose: ")
        add_p(doc, inp, bold_prefix="Inputs: ")
        add_p(doc, proc, bold_prefix="Processing: ")
        add_p(doc, outp, bold_prefix="Outputs: ")
        add_p(doc, intf, bold_prefix="Relevant Interfaces: ", space_after=10)

    # =========================================================================
    # CHAPTER 7 — REPAIRGRAPH DECISION ENGINE
    # =========================================================================
    add_heading_1(doc, "CHAPTER 7: REPAIRGRAPH DECISION ENGINE")

    add_heading_2(doc, "7.1 Deterministic Architecture vs. Black-Box AI")
    add_p(doc, 
          "A foundational engineering decision in RepairGraph is the deliberate rejection of unconstrained generative large language "
          "models (LLMs) for diagnostic scoring, repair cost estimation, and statutory lifecycle decisions. Generative AI models "
          "suffer from well-documented stochastic variance, hallucination of non-existent hardware specifications, and non-reproducible "
          "scoring that cannot withstand legal or academic scrutiny.")
    add_p(doc, 
          "Instead, RepairGraph implements a fully deterministic, two-tier rule-based expert system. Every score point, depreciation curve, "
          "cost estimate, and lifecycle verdict is mathematically traceable to explicit formulas, component price matrices, and statutory "
          "regulations. Identical symptom inputs and device contexts produce 100% reproducible diagnostic results in sub-millisecond execution time.")

    add_heading_2(doc, "7.2 Token-Boundary Symptom Parsing")
    add_p(doc, 
          "Tier 1 triage operates through word-boundary regex token matching (\\b) across eight hardware subsystem dictionaries: "
          "Display & Digitizer, Power & Battery, I/O & Charging Port, Core Logic & PMIC, Keyboard & Input, Acoustic Subsystem, "
          "Optical Camera, and Non-Volatile Storage. Word-boundary constraints prevent false-positive sub-string matches (e.g., "
          "distinguishing 'port' from 'important').")

    add_heading_2(doc, "7.3 Subsystem Classification & Hazard Detection")
    add_p(doc, 
          "In addition to component classification, the parser executes concurrent pattern scans for acute safety hazards:")
    add_bullet(doc, "Liquid Damage Detection: Keywords ('water', 'liquid', 'spill', 'coffee', 'submerged') trigger liquidDamage = true.", bold_prefix="• ")
    add_bullet(doc, "Power Failure Detection: Keywords ('no power', 'won\\'t turn on', 'dead', 'short circuit', 'burnt', 'smoke') trigger powerFailure = true.", bold_prefix="• ")
    add_bullet(doc, "Lithium Battery Combustion Risk: Keywords ('swollen', 'swelling', 'bulging') trigger immediate escalation to CRITICAL severity with physical safety warnings.", bold_prefix="• ")

    add_heading_2(doc, "7.4 Diagnostic Confidence Formulation")
    add_p(doc, 
          "Diagnostic confidence (C in [50, 95]) is derived deterministically from the density of matching domain tokens:")
    add_p(doc, 
          "Confidence = min(95, max(50, 60 + matchCount * 10))", italic=True)
    add_p(doc, 
          "Single-keyword matches receive a baseline 70% confidence, while multi-symptom descriptions converge toward the 95% ceiling.")

    add_heading_2(doc, "7.5 7-Factor Baseline Repairability Score Model")
    add_p(doc, 
          "RepairGraph formulates an original 7-Factor Repairability Score Model (S_baseline in [0, 100]) informed by general international "
          "repairability standards (e.g., French Repairability Index and IEEE standards). The model allocates 100 points across seven dimensions:")
    
    add_p(doc, "Table 5 defines the weight distribution, maximum points, and evaluation criteria for each of the seven factors.")

    tbl_factors = doc.add_table(rows=8, cols=4)
    format_table(tbl_factors, col_widths=[0.6, 2.2, 1.0, 2.4])
    factor_data = [
        ("#", "Factor Dimension", "Weight / Max", "Evaluation Criteria & Benchmarks"),
        ("1", "Physical Disassembly & Fasteners", "25 Pts (25%)", "Captive Phillips/Torx screws (Framework: 24, Lenovo: 21) vs. adhesive seals and Pentalobe screws (Apple: 14)."),
        ("2", "Spare Parts Availability", "20 Pts (20%)", "Open commercial parts supply in domestic market (Framework: 19, Apple/Samsung: 18) vs. restricted depot catalogs (Sony: 12)."),
        ("3", "Documentation & Repair Manuals", "15 Pts (15%)", "Open-source schematics (Framework: 15) and public HMM manuals (Lenovo: 14) vs. restricted service manuals (Sony: 8)."),
        ("4", "Hardware Modularity", "15 Pts (15%)", "Socketed M.2/SO-DIMM slots (Framework: 15, Dell: 13) vs. soldered unified memory/NAND (Apple: 6)."),
        ("5", "Software Locks & Parts Pairing", "10 Pts (10%)", "Plug-and-play operation (10) vs. cryptographic serial pairing barriers (Apple: 5, Samsung: 7)."),
        ("6", "Device Age & Lifecycle Support", "10 Pts (10%)", "Evaluated dynamically as max(0, min(10, round(10 - 1.5 * ageYears))). Current gen: 10, legacy (>5 yrs): 0–2."),
        ("7", "Local Service Ecosystem & Tools", "5 Pts (5%)", "Density of certified workshops and standard tool availability across Indian metro hubs (Apple/Lenovo: 5, Framework: 3).")
    ]
    for idx, (c1, c2, c3, c4) in enumerate(factor_data):
        tbl_factors.cell(idx, 0).paragraphs[0].text = c1
        tbl_factors.cell(idx, 1).paragraphs[0].text = c2
        tbl_factors.cell(idx, 2).paragraphs[0].text = c3
        tbl_factors.cell(idx, 3).paragraphs[0].text = c4

    add_heading_2(doc, "7.6 Incident-Specific Deduction Penalties")
    add_p(doc, 
          "When evaluating an active repair incident, acute hazards apply explicit penalty deductions from the baseline score, yielding "
          "the final repairability score S_repair:")
    add_p(doc, 
          "S_repair = max(10, min(98, S_baseline - Penalties))", italic=True)
    
    add_p(doc, "Table 6 details the deduction amounts and engineering justifications for incident penalties.")

    tbl_penalties = doc.add_table(rows=5, cols=3)
    format_table(tbl_penalties, col_widths=[1.5, 1.2, 3.5])
    penalty_data = [
        ("Hazard Incident", "Deduction", "Engineering Rationale"),
        ("Liquid Damage", "-20 Points", "High risk of latent electrolytic oxidation, dendritic growth, and PCB substrate delamination."),
        ("Core Logic Board Fault", "-15 Points", "Requires multi-layer board trace inspection, BGA reballing, or micro-soldering."),
        ("Power Failure / Short", "-10 Points", "Main power rail or PMIC breakdown threatening cascading IC overvoltage damage."),
        ("Critical Failure Severity", "-10 Points", "Multi-subsystem compromise or acute physical hazard (e.g., swollen pouch cell).")
    ]
    for idx, (c1, c2, c3) in enumerate(penalty_data):
        tbl_penalties.cell(idx, 0).paragraphs[0].text = c1
        tbl_penalties.cell(idx, 1).paragraphs[0].text = c2
        tbl_penalties.cell(idx, 2).paragraphs[0].text = c3

    add_heading_2(doc, "7.7 Device Depreciation & Valuation Formulation")
    add_p(doc, 
          "Consumer electronics experience steep annual depreciation. When a current market valuation is not explicitly supplied, "
          "the engine computes the depreciated fair market value V_current from the original purchase price P and age in years t:")
    add_p(doc, 
          "V_depreciated = P * (1 - 0.22)^t", italic=True)
    add_p(doc, 
          "V_current = max(P * 0.15, round(V_depreciated / 100) * 100)", italic=True)
    add_p(doc, 
          "A statutory residual floor of 15% of the purchase price is enforced, reflecting the salvage value of raw materials and functional sub-assemblies.")

    add_heading_2(doc, "7.8 Component Replacement Cost Benchmarks")
    add_p(doc, 
          "Estimated repair costs [C_min, C_max] are computed via a multi-dimensional matrix (src/server/engine/costMatrix.ts) scaled by "
          "hardware category, component type, and brand tier. High-end flagship brands (Apple, Framework) incorporate a 1.2x–1.35x premium "
          "reflecting specialized OEM parts pricing, while mainstream brands (Lenovo, Dell, Xiaomi) reflect domestic aftermarket benchmarks.")

    add_heading_2(doc, "7.9 Repair Cost Ratio (RCR) Calculation")
    add_p(doc, 
          "The Repair Cost Ratio (RCR) evaluates repair economics by comparing average estimated repair cost against current fair market value:")
    add_p(doc, 
          "C_avg = (C_min + C_max) / 2", italic=True)
    add_p(doc, 
          "RCR = C_avg / V_current", italic=True)

    add_heading_2(doc, "7.10 Value-Preservation Economic Score")
    add_p(doc, 
          "The Economic Score (S_econ in [0, 100]) quantifies the degree of residual value preserved by repairing rather than replacing:")
    add_p(doc, 
          "S_econ = max(0, min(100, round((1 - RCR) * 100)))", italic=True)
    add_p(doc, 
          "An RCR of 0.25 yields an economic score of 75/100 (highly viable), whereas an RCR of 0.85 yields 15/100 (financially unviable).")

    add_heading_2(doc, "7.11 Statutory Lifecycle Decision Matrix")
    add_p(doc, 
          "The decision engine evaluates RCR, S_repair, device age, and hazard flags against statutory rules to output one of five recommendations. "
          "Table 7 summarizes the decision rules and corresponding statutory classifications.")

    tbl_decision = doc.add_table(rows=6, cols=3)
    format_table(tbl_decision, col_widths=[1.2, 2.5, 2.5])
    decision_data = [
        ("Action Verdict", "Mathematical & Incident Conditions", "Statutory Classification & Rationale"),
        ("RECYCLE", "Liquid AND Power failure, OR (Logic Board AND RCR > 0.85), OR RCR > 0.92", "India E-Waste Rules 2022: Hardware non-viable; divert to authorized EPR recyclers for precious metal recovery."),
        ("DIY", "diyFeasible == true AND S_repair >= 72 AND RCR <= 0.28", "Right to Repair: Modular component accessible for safe consumer self-replacement using standard hand tools."),
        ("REPAIR", "RCR <= 0.52 AND S_repair >= 42", "Professional Repair: Economically sound; well below 50% replacement threshold; preserves operational life."),
        ("RESELL", "0.50 < RCR <= 0.75 AND powerFailure == false", "Secondary Market Salvage: Repair approaches marginal utility; liquidation or parts salvage yields higher return."),
        ("REPLACE", "RCR > 0.75 OR ageYears >= 6.0 OR S_repair < 35", "Hardware Retirement: Capital better deployed to modern system with active security support.")
    ]
    for idx, (c1, c2, c3) in enumerate(decision_data):
        tbl_decision.cell(idx, 0).paragraphs[0].text = c1
        tbl_decision.cell(idx, 1).paragraphs[0].text = c2
        tbl_decision.cell(idx, 2).paragraphs[0].text = c3

    add_heading_2(doc, "7.12 Automated Explainability Audit Trail")
    add_p(doc, 
          "Every decision compiles three structured explainability bullets: Economic Assessment, Technical Feasibility, and Environmental "
          "Impact (calculating CO2e manufacturing emissions averted and electronic waste grams diverted under the E-Waste Rules 2022).")
    
    add_figure_image(doc, "docs/report_assets/figure3_engine_flow.png", "Figure 3: Deterministic Diagnostic & Decision Engine Flow")

    # =========================================================================
    # CHAPTER 8 — DATABASE DESIGN
    # =========================================================================
    add_heading_1(doc, "CHAPTER 8: DATABASE DESIGN")

    add_heading_2(doc, "8.1 Relational Design Philosophy")
    add_p(doc, 
          "RepairGraph utilizes a strictly normalized relational database architecture implemented on PostgreSQL 16+. Relational modeling "
          "was chosen over document-based NoSQL stores because hardware maintenance requires strong transactional consistency (ACID), "
          "strict foreign key enforcement, multi-table quote comparisons, and permanent audit provenance across device transfers.")

    add_heading_2(doc, "8.2 Entity Relationship Diagram (11 Models)")
    add_p(doc, "Figure 4 depicts the entity-relationship model comprising 11 core tables and their cardinality relationships.")
    
    add_figure_image(doc, "docs/report_assets/figure4_er_diagram.png", "Figure 4: Relational Database Schema & Entity Relationships (11 Models)")

    add_heading_2(doc, "8.3 Relational Entity Specifications")
    add_p(doc, "Table 8 catalogs the 11 normalized relational models defined in prisma/schema.prisma.")

    tbl_models = doc.add_table(rows=12, cols=3)
    format_table(tbl_models, col_widths=[1.5, 2.0, 2.7])
    model_data = [
        ("Model Name", "Primary Key & Relations", "Functional Responsibility"),
        ("User", "id (PK, cuid), Unique email", "Stores user identities, bcrypt password hashes, and roles (USER/REPAIRER/ADMIN)."),
        ("Device", "id (PK), FK -> User", "Physical hardware registry (category, brand, model, serial, purchasePrice, valuation)."),
        ("RepairRequest", "id (PK), FK -> Device, FK -> User", "Problem tickets capturing user symptoms, urgency, and lifecycle status."),
        ("Diagnosis", "id (PK), 1:1 FK -> RepairRequest", "Stores failure category, root-cause issue, confidence, and evidence points."),
        ("RepairRecommendation", "id (PK), 1:1 FK -> RepairRequest", "Decision engine outputs: repairability score, economic score, action, and reasoning."),
        ("Repairer", "id (PK), 1:1 FK -> User", "Technician business profile, address, geolocation coordinates, rating, and total jobs."),
        ("RepairerSpecialization", "id (PK), FK -> Repairer", "Granular technician competencies mapped by device category, brand, and service type."),
        ("Quote", "id (PK), FK -> RepairRequest, FK -> Repairer", "Competitive technician bids specifying estimated cost, days, notes, and status."),
        ("RepairJob", "id (PK), 1:1 -> RepairRequest, 1:1 -> Quote", "Active repair execution state machine orchestrating bench stages to completion."),
        ("RepairHistory", "id (PK), FK -> Device, 1:1 -> RepairJob", "Standardized Repair Passport: immutable maintenance ledger tied to serial numbers."),
        ("Review", "id (PK), 1:1 -> RepairJob, FK -> User", "Post-service customer feedback, 1–5 star ratings, and technician review text.")
    ]
    for idx, (c1, c2, c3) in enumerate(model_data):
        tbl_models.cell(idx, 0).paragraphs[0].text = c1
        tbl_models.cell(idx, 1).paragraphs[0].text = c2
        tbl_models.cell(idx, 2).paragraphs[0].text = c3

    add_heading_2(doc, "8.4 Custom Enums (9 Enums)")
    add_p(doc, "Table 9 defines the 9 database enums enforcing strict domain constraints at the database level.")

    tbl_enums = doc.add_table(rows=10, cols=3)
    format_table(tbl_enums, col_widths=[1.5, 2.2, 2.5])
    enum_data = [
        ("Enum Identifier", "Allowed Constant Values", "Domain Context"),
        ("UserRole", "USER, REPAIRER, ADMIN", "Role-based access control and system authorization boundaries."),
        ("DeviceCategory", "SMARTPHONE, LAPTOP, TABLET, HEADPHONES, MONITOR", "Supported consumer electronic hardware categories."),
        ("DeviceCondition", "EXCELLENT, GOOD, FAIR, DEGRADED, CRITICAL", "Physical condition and cosmetic/functional state of hardware."),
        ("UrgencyLevel", "LOW, MEDIUM, HIGH", "Customer-reported urgency for repair turnaround priority."),
        ("RequestStatus", "REQUESTED, ACCEPTED, DIAGNOSING, WAITING_FOR_PART, REPAIRING, TESTING, COMPLETED, CANCELLED", "End-to-end lifecycle states for repair tickets."),
        ("RecommendedAction", "REPAIR, DIY, REPLACE, RESELL, RECYCLE", "Statutory decision engine verdict outcomes."),
        ("VerificationStatus", "PENDING, VERIFIED, REJECTED", "Technician credential verification and passport entry trust status."),
        ("QuoteStatus", "PENDING, ACCEPTED, REJECTED, WITHDRAWN", "Bidding lifecycle states for technician quotes."),
        ("JobStatus", "ACCEPTED, DIAGNOSING, WAITING_FOR_PART, REPAIRING, TESTING, COMPLETED, CANCELLED", "Active bench execution milestones for repair jobs.")
    ]
    for idx, (c1, c2, c3) in enumerate(enum_data):
        tbl_enums.cell(idx, 0).paragraphs[0].text = c1
        tbl_enums.cell(idx, 1).paragraphs[0].text = c2
        tbl_enums.cell(idx, 2).paragraphs[0].text = c3

    add_heading_2(doc, "8.5 Relational Invariants & Integrity Constraints")
    add_bullet(doc, "Foreign Key Cascades: Child records reference parents via onDelete: Cascade, ensuring zero orphaned entities upon deletion.", bold_prefix="• ")
    add_bullet(doc, "Single Job per Quote: Unique constraint on RepairJob.quoteId guarantees that a quote produces at most one active job.", bold_prefix="• ")
    add_bullet(doc, "Single Job per Request: Unique constraint on RepairJob.repairRequestId ensures only one quote is accepted per ticket.", bold_prefix="• ")
    add_bullet(doc, "Single Review per Job: Unique constraint on Review.repairJobId prevents duplicate review submissions.", bold_prefix="• ")

    add_heading_2(doc, "8.6 Prisma Schema & Migration Baseline")
    add_p(doc, 
          "The production schema is managed strictly through version-controlled Prisma migrations. The baseline migration (prisma/migrations/0_init/migration.sql) "
          "is deployed to production using npx prisma migrate deploy, explicitly prohibiting destructive prisma db push in production.")

    add_heading_2(doc, "8.7 Cloud Serverless Pooling with Neon")
    add_p(doc, 
          "Because serverless functions execute ephemerally, direct database connections can rapidly exhaust connection limits. Neon provides "
          "an integrated PgBouncer connection pooler accessed via port 6543 (DATABASE_URL), while direct connections (port 5432 via DIRECT_URL) "
          "are reserved for executing declarative schema migrations.")

    # =========================================================================
    # CHAPTER 9 — REST API DESIGN
    # =========================================================================
    add_heading_1(doc, "CHAPTER 9: REST API DESIGN")

    add_heading_2(doc, "9.1 RESTful Conventions & Error Payloads")
    add_p(doc, 
          "All API routes are served under the /api base path and conform strictly to REST principles. Standard HTTP verbs (GET, POST, PUT, DELETE) "
          "express semantic intent. Successful responses return standardized envelopes ({ data: ... }), while errors return RFC 7807 structured "
          "objects ({ error: { code, message, details } }) with accurate HTTP status codes (200, 201, 400, 401, 403, 404, 409, 429, 500).")

    add_heading_2(doc, "9.2 API Resource Namespaces")
    add_p(doc, 
          "The API spans 10 cohesive resource namespaces: /api/auth, /api/devices, /api/repair-requests, /api/quotes, /api/repair-jobs, "
          "/api/repair-history, /api/repairers, /api/reviews, /api/health, and /api/seed.")

    add_heading_2(doc, "9.3 HTTP Method Operations Catalog")
    add_p(doc, 
          "The backend implements exactly 21 Next.js route handler files (route.ts) comprising 36 distinct HTTP method handlers "
          "(13 GET, 11 POST, 7 PUT, 5 DELETE).")

    add_heading_2(doc, "9.4 CRUD Functionality Across Resource Namespaces")
    add_p(doc, "Table 10 demonstrates verified CRUD operations across all domain entities.")

    tbl_crud = doc.add_table(rows=7, cols=5)
    format_table(tbl_crud, col_widths=[1.4, 1.2, 1.2, 1.2, 1.2])
    crud_data = [
        ("Resource Namespace", "Create (C)", "Read (R)", "Update (U)", "Delete (D)"),
        ("Devices (/api/devices)", "POST /devices", "GET /devices, /:id", "PUT /devices/:id", "DELETE /devices/:id"),
        ("Requests (/api/repair-requests)", "POST /repair-requests", "GET /requests, /:id", "PUT /requests/:id", "DELETE /requests/:id"),
        ("Quotes (/api/quotes)", "POST /requests/:id/quotes", "GET /quotes, /:id", "PUT /quotes/:id", "DELETE /quotes/:id"),
        ("Jobs (/api/repair-jobs)", "POST /repair-jobs", "GET /jobs, /:id", "PUT /repair-jobs/:id", "Cancelled status"),
        ("Passport (/api/repair-history)", "Auto on completion", "GET /repair-history", "Immutable by design", "Cascades on device delete"),
        ("Reviews (/api/reviews)", "POST /reviews", "GET /reviews, /:id", "PUT /reviews/:id", "DELETE /reviews/:id")
    ]
    for idx, (c1, c2, c3, c4, c5) in enumerate(crud_data):
        tbl_crud.cell(idx, 0).paragraphs[0].text = c1
        tbl_crud.cell(idx, 1).paragraphs[0].text = c2
        tbl_crud.cell(idx, 2).paragraphs[0].text = c3
        tbl_crud.cell(idx, 3).paragraphs[0].text = c4
        tbl_crud.cell(idx, 4).paragraphs[0].text = c5

    add_heading_2(doc, "9.5 Representative REST API Route Catalog")
    add_p(doc, "Table 11 catalogs representative endpoints implemented in src/app/api.")

    tbl_api = doc.add_table(rows=11, cols=4)
    format_table(tbl_api, col_widths=[1.5, 0.8, 1.5, 2.4])
    api_data = [
        ("Endpoint Route", "Method", "Auth Requirement", "Functional Description"),
        ("/api/auth/register", "POST", "Public", "Creates user account, hashes password with bcrypt, sets session cookie."),
        ("/api/auth/login", "POST", "Public", "Verifies credentials, issues JWT in HttpOnly cookie, suppresses raw token."),
        ("/api/auth/me", "GET", "Authenticated", "Returns authenticated user profile and role."),
        ("/api/devices", "GET/POST", "Authenticated", "Lists user's devices; registers new physical hardware asset."),
        ("/api/devices/:id", "GET/PUT/DEL", "Owner / Admin", "Inspects, modifies valuation, or deletes registered device."),
        ("/api/repair-requests/:id/diagnose", "POST", "Owner / Admin", "Executes deterministic diagnostic & economic decision engine."),
        ("/api/repair-requests/:id/quotes", "GET/POST", "Technician / Owner", "Lists quotes; technician submits competitive bid."),
        ("/api/quotes/:id", "PUT/DEL", "Owner / Technician", "Accepts quote (creates job) or withdraws submitted quote."),
        ("/api/repair-jobs/:id", "GET/PUT", "Assigned Tech / Owner", "Inspects bench progress; technician advances lifecycle stages."),
        ("/api/health", "GET", "Public", "Active PostgreSQL ping (SELECT 1) returning connection latency and uptime.")
    ]
    for idx, (c1, c2, c3, c4) in enumerate(api_data):
        tbl_api.cell(idx, 0).paragraphs[0].text = c1
        tbl_api.cell(idx, 1).paragraphs[0].text = c2
        tbl_api.cell(idx, 2).paragraphs[0].text = c3
        tbl_api.cell(idx, 3).paragraphs[0].text = c4

    # =========================================================================
    # CHAPTER 10 — AUTHENTICATION AND SECURITY
    # =========================================================================
    add_heading_1(doc, "CHAPTER 10: AUTHENTICATION AND SECURITY")

    add_heading_2(doc, "10.1 Password Cryptography (bcrypt)")
    add_p(doc, 
          "User passwords are protected using bcrypt with a salt cost factor of 10. Passwords undergo irreversible salting and hashing "
          "prior to database insertion, protecting credentials against offline dictionary and rainbow-table attacks.")

    add_heading_2(doc, "10.2 JWT Session Tokens & Cookie Security")
    add_p(doc, 
          "Authentication sessions are encapsulated in JSON Web Tokens signed with HMAC-SHA256 using a high-entropy secret key (JWT_SECRET). "
          "Tokens are transmitted exclusively in cookies named rg_token configured with:")
    add_bullet(doc, "HttpOnly: true — Prevents client-side JavaScript access, neutralizing Cross-Site Scripting (XSS) session theft.", bold_prefix="• ")
    add_bullet(doc, "SameSite: lax — Prevents Cross-Site Request Forgery (CSRF) in standard cross-origin top-level navigation.", bold_prefix="• ")
    add_bullet(doc, "Secure: true — Automatically enforced in production environments (NODE_ENV === 'production'), ensuring transmission only over TLS 1.3.", bold_prefix="• ")
    add_bullet(doc, "Path: / — Scopes the cookie across all application routes.", bold_prefix="• ")

    add_heading_2(doc, "10.3 Token Suppression Strategy")
    add_p(doc, 
          "By default, browser authentication responses from /api/auth/login and /api/auth/register return only sanitized user data and "
          "completely omit the raw JWT token string from the JSON payload. This architectural control completely eliminates the temptation "
          "or capability of client-side scripts to store tokens in insecure localStorage or sessionStorage.")

    add_heading_2(doc, "10.4 In-Memory Sliding-Window Rate Limiting")
    add_p(doc, 
          "Authentication routes are protected by an in-memory sliding-window rate limiter (src/server/auth/rateLimit.ts) keyed by client IP:")
    add_bullet(doc, "Login Limiter: Maximum 10 requests / minute per IP.", bold_prefix="• ")
    add_bullet(doc, "Registration Limiter: Maximum 5 requests / minute per IP.", bold_prefix="• ")
    add_p(doc, 
          "Exceeded limits immediately trigger HTTP 429 RATE_LIMIT_EXCEEDED with a Retry-After header, defeating credential brute-forcing.")

    add_heading_2(doc, "10.5 HTTP Defense-in-Depth Security Headers")
    add_p(doc, 
          "next.config.ts enforces strict HTTP security headers across all routes:")
    add_bullet(doc, "Strict-Transport-Security: max-age=31536000; includeSubDomains (Enforces HTTPS for 1 year).", bold_prefix="• ")
    add_bullet(doc, "X-Frame-Options: DENY (Prevents clickjacking framing).", bold_prefix="• ")
    add_bullet(doc, "X-Content-Type-Options: nosniff (Blocks MIME-type sniffing).", bold_prefix="• ")
    add_bullet(doc, "Referrer-Policy: strict-origin-when-cross-origin (Protects path information).", bold_prefix="• ")
    add_bullet(doc, "Permissions-Policy: camera=(), microphone=(), geolocation=() (Restricts browser sensor hardware).", bold_prefix="• ")

    add_heading_2(doc, "10.6 Error Sanitization & Leak Suppression")
    add_p(doc, 
          "Production error handlers intercept raw database exceptions. Prisma table names, internal SQL queries, and server stack traces "
          "are stripped, returning safe, generic error messages to clients while logging full traces to serverless logs.")

    add_heading_2(doc, "10.7 Zero-Secret Version Control Policy")
    add_p(doc, 
          "All cryptographic keys (JWT_SECRET) and database credentials (DATABASE_URL, DIRECT_URL) are injected at runtime via cloud provider "
          "environment consoles. Zero credentials or secret values exist in source control.")

    doc.add_page_break()
