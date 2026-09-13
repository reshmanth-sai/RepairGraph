import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('docs/report_assets', exist_ok=True)

# Common styling
BG_COLOR = '#FAFAFA'
BOX_BG = '#FFFFFF'
BORDER_COLOR = '#1F2937'
TEXT_COLOR = '#111827'
ACCENT_ORANGE = '#EA580C'
ACCENT_BLUE = '#2563EB'
ACCENT_GREEN = '#16A34A'
MUTED_GRAY = '#6B7280'

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# -----------------------------------------------------------------------------
# Figure 1: Overall System Architecture
# -----------------------------------------------------------------------------
def generate_fig1():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Title
    ax.text(5, 6.6, 'Figure 1: RepairGraph Unified Full-Stack Architecture', 
            ha='center', va='center', fontsize=13, fontweight='bold', color=TEXT_COLOR)

    # 1. User Client Box
    ax.add_patch(patches.FancyBboxPatch((0.5, 4.8), 2.2, 1.2, boxstyle="round,pad=0.1", 
                                        fc='#EFF6FF', ec=ACCENT_BLUE, lw=1.5))
    ax.text(1.6, 5.5, 'User / Browser Client', ha='center', va='center', fontsize=10, fontweight='bold', color=ACCENT_BLUE)
    ax.text(1.6, 5.1, 'React 19 SPA Interface\nTailwind CSS v4\nHTTPS / Fetch API', ha='center', va='center', fontsize=8, color=TEXT_COLOR)

    # Arrow 1: User -> Vercel
    ax.annotate('', xy=(3.4, 5.4), xytext=(2.7, 5.4),
                arrowprops=dict(arrowstyle="->", lw=2, color=ACCENT_BLUE))
    ax.text(3.05, 5.6, 'HTTPS / TLS', ha='center', va='bottom', fontsize=7, color=MUTED_GRAY)

    # 2. Vercel Cloud Platform (Outer Box)
    ax.add_patch(patches.FancyBboxPatch((3.4, 1.0), 4.2, 5.2, boxstyle="round,pad=0.15", 
                                        fc='#FFF7ED', ec=ACCENT_ORANGE, lw=1.8))
    ax.text(5.5, 5.9, 'Vercel Serverless Cloud Platform (Node.js 24.x)', 
            ha='center', va='center', fontsize=10, fontweight='bold', color=ACCENT_ORANGE)

    # Inside Vercel: Sub-boxes
    # Next.js Frontend
    ax.add_patch(patches.FancyBboxPatch((3.7, 4.7), 3.6, 0.9, boxstyle="round,pad=0.08", fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(5.5, 5.25, 'Next.js 15 App Router Frontend', ha='center', va='center', fontsize=9, fontweight='bold')
    ax.text(5.5, 4.95, 'Server Components, SSR/SSG & Client Hydration', ha='center', va='center', fontsize=7.5, color=MUTED_GRAY)

    # Arrow inside Vercel
    ax.annotate('', xy=(5.5, 4.3), xytext=(5.5, 4.7), arrowprops=dict(arrowstyle="->", lw=1.5, color=BORDER_COLOR))

    # REST API Route Handlers
    ax.add_patch(patches.FancyBboxPatch((3.7, 3.4), 3.6, 0.9, boxstyle="round,pad=0.08", fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(5.5, 3.95, 'REST API Route Handlers (/api/*)', ha='center', va='center', fontsize=9, fontweight='bold')
    ax.text(5.5, 3.65, '21 Route Files • 36 HTTP Handlers • Zod Validation', ha='center', va='center', fontsize=7.5, color=MUTED_GRAY)

    # Arrow inside Vercel
    ax.annotate('', xy=(5.5, 3.0), xytext=(5.5, 3.4), arrowprops=dict(arrowstyle="->", lw=1.5, color=BORDER_COLOR))

    # Business Services & Engine
    ax.add_patch(patches.FancyBboxPatch((3.7, 1.4), 3.6, 1.6, boxstyle="round,pad=0.08", fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(5.5, 2.7, 'Server Business Logic Layer', ha='center', va='center', fontsize=9, fontweight='bold')
    ax.text(5.5, 2.4, 'Auth, Device, Request, Quote, Job, Review Services', ha='center', va='center', fontsize=7.5, color=MUTED_GRAY)
    
    ax.add_patch(patches.Rectangle((3.9, 1.6), 3.2, 0.6, fc='#FEF3C7', ec='#D97706', lw=1))
    ax.text(5.5, 1.9, 'Deterministic Decision & Diagnostic Engine', ha='center', va='center', fontsize=8, fontweight='bold', color='#92400E')

    # Arrow from Vercel -> Database
    ax.annotate('', xy=(8.3, 3.6), xytext=(7.6, 3.6),
                arrowprops=dict(arrowstyle="->", lw=2, color=ACCENT_GREEN))
    ax.text(7.95, 3.8, 'Prisma ORM\nPooled TLS', ha='center', va='bottom', fontsize=7.5, color=ACCENT_GREEN)

    # 3. Neon Cloud Database
    ax.add_patch(patches.FancyBboxPatch((8.3, 2.2), 1.4, 2.8, boxstyle="round,pad=0.1", 
                                        fc='#F0FDF4', ec=ACCENT_GREEN, lw=1.8))
    ax.text(9.0, 4.6, 'Neon Cloud\nPostgreSQL', ha='center', va='center', fontsize=9.5, fontweight='bold', color=ACCENT_GREEN)
    ax.text(9.0, 3.6, 'PostgreSQL 16+\n11 Normalized\nRelational Entities\n9 Custom Enums\nACID Invariants\nPgBouncer Pool', 
            ha='center', va='center', fontsize=7.5, color=TEXT_COLOR)

    plt.tight_layout()
    plt.savefig('docs/report_assets/figure1_architecture.png', dpi=300)
    plt.close()

# -----------------------------------------------------------------------------
# Figure 2: Data Flow
# -----------------------------------------------------------------------------
def generate_fig2():
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    ax.text(5, 4.6, 'Figure 2: End-to-End Request & Data Processing Pipeline', 
            ha='center', va='center', fontsize=12, fontweight='bold', color=TEXT_COLOR)

    steps = [
        ('1. Browser Client', 'HTTPS Request\nCookie rg_token', '#EFF6FF', ACCENT_BLUE),
        ('2. Rate Limiter', 'Sliding-Window\n10/min auth limit', '#FEE2E2', '#DC2626'),
        ('3. Zod Validator', 'Schema Bounds\nType Coercion', '#FEF3C7', '#D97706'),
        ('4. Auth & IDOR', 'JWT Verification\nOwner Permission', '#F3E8FF', '#9333EA'),
        ('5. Business Service', 'Domain Rules\nState Transitions', '#FFF7ED', ACCENT_ORANGE),
        ('6. Decision Engine', '7-Factor Scoring\nLifecycle Action', '#FEF08A', '#CA8A04'),
        ('7. Prisma & Neon', 'Parameterized SQL\nRelational DB', '#F0FDF4', ACCENT_GREEN),
        ('8. JSON Envelope', 'RFC 7807 Errors\nor { data: ... }', '#EFF6FF', ACCENT_BLUE),
    ]

    # Draw 4 steps on top row, 4 steps on bottom row
    box_w, box_h = 1.8, 1.1
    xs_top = [0.5, 2.9, 5.3, 7.7]
    xs_bot = [7.7, 5.3, 2.9, 0.5]

    for i in range(4):
        title, desc, bg, border = steps[i]
        x = xs_top[i]
        ax.add_patch(patches.FancyBboxPatch((x, 2.7), box_w, box_h, boxstyle="round,pad=0.08", fc=bg, ec=border, lw=1.2))
        ax.text(x + box_w/2, 3.5, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color=border)
        ax.text(x + box_w/2, 3.05, desc, ha='center', va='center', fontsize=7, color=TEXT_COLOR)
        if i < 3:
            ax.annotate('', xy=(xs_top[i+1], 3.25), xytext=(x + box_w, 3.25),
                        arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    # Down arrow from step 4 to 5
    ax.annotate('', xy=(7.7 + box_w/2, 2.1), xytext=(7.7 + box_w/2, 2.7),
                arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    for i in range(4):
        title, desc, bg, border = steps[i+4]
        x = xs_bot[i]
        ax.add_patch(patches.FancyBboxPatch((x, 0.9), box_w, box_h, boxstyle="round,pad=0.08", fc=bg, ec=border, lw=1.2))
        ax.text(x + box_w/2, 1.7, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color=border)
        ax.text(x + box_w/2, 1.25, desc, ha='center', va='center', fontsize=7, color=TEXT_COLOR)
        if i < 3:
            ax.annotate('', xy=(xs_bot[i+1] + box_w, 1.45), xytext=(x, 1.45),
                        arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    plt.tight_layout()
    plt.savefig('docs/report_assets/figure2_data_flow.png', dpi=300)
    plt.close()

# -----------------------------------------------------------------------------
# Figure 3: Engine Pipeline
# -----------------------------------------------------------------------------
def generate_fig3():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.6, 'Figure 3: Deterministic Diagnostic & Decision Engine Flow', 
            ha='center', va='center', fontsize=12, fontweight='bold', color=TEXT_COLOR)

    # Input Box
    ax.add_patch(patches.FancyBboxPatch((0.5, 4.8), 2.2, 1.4, boxstyle="round,pad=0.08", fc='#EFF6FF', ec=ACCENT_BLUE, lw=1.3))
    ax.text(1.6, 5.9, 'Device & Symptoms', ha='center', va='center', fontsize=8.5, fontweight='bold', color=ACCENT_BLUE)
    ax.text(1.6, 5.3, '• Category, Brand, Model\n• Purchase Price / Date\n• Free-Text Symptoms', ha='center', va='center', fontsize=7, color=TEXT_COLOR)

    # Arrow to Tier 1
    ax.annotate('', xy=(3.2, 5.5), xytext=(2.7, 5.5), arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    # Tier 1 Box
    ax.add_patch(patches.FancyBboxPatch((3.2, 4.5), 3.4, 1.8, boxstyle="round,pad=0.08", fc='#FEF3C7', ec='#D97706', lw=1.3))
    ax.text(4.9, 6.0, 'TIER 1: Symptom Extraction', ha='center', va='center', fontsize=9, fontweight='bold', color='#B45309')
    ax.text(4.9, 5.25, '• Word-boundary regex token matching\n• 8 Component categories (Display, Battery...)\n• Hazard detection (Liquid ingress, Swollen cell)\n• Confidence scoring & severity calculation', ha='center', va='center', fontsize=7, color=TEXT_COLOR)

    # Arrow to Tier 2
    ax.annotate('', xy=(7.1, 5.5), xytext=(6.6, 5.5), arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    # Intermediate Signals
    ax.add_patch(patches.FancyBboxPatch((7.1, 4.8), 2.4, 1.4, boxstyle="round,pad=0.08", fc='#F3E8FF', ec='#9333EA', lw=1.3))
    ax.text(8.3, 5.9, 'Diagnostic Signals', ha='center', va='center', fontsize=8.5, fontweight='bold', color='#9333EA')
    ax.text(8.3, 5.3, '• primaryComponent\n• severity (LOW..CRITICAL)\n• liquidDamage: boolean\n• powerFailure: boolean\n• diyFeasible: boolean', ha='center', va='center', fontsize=7, color=TEXT_COLOR)

    # Arrow down to Tier 2
    ax.annotate('', xy=(8.3, 4.2), xytext=(8.3, 4.8), arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    # Tier 2 Box (Spanning width)
    ax.add_patch(patches.FancyBboxPatch((0.5, 1.6), 9.0, 2.5, boxstyle="round,pad=0.1", fc='#FFF7ED', ec=ACCENT_ORANGE, lw=1.5))
    ax.text(5.0, 3.8, 'TIER 2: Deterministic Decision Engine & Economic Model', ha='center', va='center', fontsize=10, fontweight='bold', color=ACCENT_ORANGE)

    # 3 sub-columns inside Tier 2
    # 7-Factor Model
    ax.add_patch(patches.Rectangle((0.8, 1.9), 2.6, 1.6, fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(2.1, 3.25, '7-Factor Model (100 Pts)', ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(2.1, 2.5, '1. Disassembly (25)\n2. Parts Availability (20)\n3. Documentation (15)\n4. Modularity (15)\n5. Parts Pairing (10)\n6. Age & Support (10)\n7. Service Ecosystem (5)', ha='center', va='center', fontsize=6.5, color=TEXT_COLOR)

    # Economic Math
    ax.add_patch(patches.Rectangle((3.7, 1.9), 2.6, 1.6, fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(5.0, 3.25, 'Economic Formulas', ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(5.0, 2.5, '• Depreciation (22%/yr):\n  V = P × (1 - 0.22)^t\n• Cost Range: [Cmin, Cmax]\n• Repair Cost Ratio (RCR):\n  RCR = Cavg / V\n• Econ Score: (1 - RCR)×100', ha='center', va='center', fontsize=6.5, color=TEXT_COLOR)

    # Lifecycle Matrix
    ax.add_patch(patches.Rectangle((6.6, 1.9), 2.6, 1.6, fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(7.9, 3.25, 'Lifecycle Thresholds', ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(7.9, 2.5, '• DIY: RCR≤0.28, S≥72\n• REPAIR: RCR≤0.52, S≥42\n• RESELL: 0.50<RCR≤0.75\n• REPLACE: RCR>0.75, t≥6\n• RECYCLE: Liquid+Power\n  or RCR>0.92 (E-Waste Rules)', ha='center', va='center', fontsize=6.5, color=TEXT_COLOR)

    # Arrow down to Action Result
    ax.annotate('', xy=(5.0, 0.9), xytext=(5.0, 1.6), arrowprops=dict(arrowstyle="->", lw=1.5, color=ACCENT_GREEN))

    # Output Box
    ax.add_patch(patches.FancyBboxPatch((1.5, 0.2), 7.0, 0.7, boxstyle="round,pad=0.08", fc='#F0FDF4', ec=ACCENT_GREEN, lw=1.4))
    ax.text(5.0, 0.55, 'Action Verdict (REPAIR | DIY | REPLACE | RESELL | RECYCLE) + Explainability Audit Trail', 
            ha='center', va='center', fontsize=8.5, fontweight='bold', color=ACCENT_GREEN)

    plt.tight_layout()
    plt.savefig('docs/report_assets/figure3_engine_flow.png', dpi=300)
    plt.close()

# -----------------------------------------------------------------------------
# Figure 4: Database ER Diagram (11 Models)
# -----------------------------------------------------------------------------
def generate_fig4():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.7, 'Figure 4: Relational Database Schema & Entity Relationships (11 Models)', 
            ha='center', va='center', fontsize=12, fontweight='bold', color=TEXT_COLOR)

    # Entities layout
    # Row 1: User, Device, RepairRequest
    # Row 2: Repairer, Diagnosis, RepairRecommendation
    # Row 3: RepairerSpecialization, Quote, RepairJob
    # Row 4: Review, RepairHistory

    def draw_entity(x, y, w, h, name, fields):
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05", fc=BOX_BG, ec=BORDER_COLOR, lw=1.2))
        ax.add_patch(patches.Rectangle((x, y + h - 0.35), w, 0.35, fc='#E2E8F0', ec=BORDER_COLOR, lw=1))
        ax.text(x + w/2, y + h - 0.18, name, ha='center', va='center', fontsize=8, fontweight='bold', color=BORDER_COLOR)
        ax.text(x + 0.1, y + (h - 0.35)/2, fields, ha='left', va='center', fontsize=6, color=TEXT_COLOR)

    # Row 1
    draw_entity(0.5, 4.8, 2.0, 1.4, 'User', '• id (PK, cuid)\n• email (Unique)\n• passwordHash\n• role: UserRole\n• phone, timestamps')
    draw_entity(3.8, 4.8, 2.4, 1.4, 'Device', '• id (PK, cuid)\n• userId (FK -> User)\n• category, brand, model\n• serialNumber, purchasePrice\n• currentValue, condition')
    draw_entity(7.2, 4.8, 2.4, 1.4, 'RepairRequest', '• id (PK, cuid)\n• deviceId (FK -> Device)\n• userId (FK -> User)\n• description, urgency\n• status: RequestStatus')

    # Connections Row 1
    ax.annotate('', xy=(3.8, 5.5), xytext=(2.5, 5.5), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))
    ax.text(3.15, 5.65, '1 : N', ha='center', va='bottom', fontsize=7, color=MUTED_GRAY)

    ax.annotate('', xy=(7.2, 5.5), xytext=(6.2, 5.5), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))
    ax.text(6.7, 5.65, '1 : N', ha='center', va='bottom', fontsize=7, color=MUTED_GRAY)

    # Row 2
    draw_entity(0.5, 2.7, 2.0, 1.4, 'Repairer', '• id (PK, cuid)\n• userId (1:1 -> User)\n• businessName, address\n• lat, lng, rating\n• totalJobs, status')
    draw_entity(4.0, 2.8, 2.2, 1.2, 'Diagnosis', '• id (PK, cuid)\n• repairRequestId (1:1)\n• issueCategory, possibleIssue\n• confidence, evidence[]')
    draw_entity(7.2, 2.8, 2.4, 1.2, 'RepairRecommendation', '• id (PK, cuid)\n• repairRequestId (1:1)\n• repairabilityScore, econScore\n• recommendedAction, reasoning')

    # Connections User -> Repairer
    ax.annotate('', xy=(1.5, 4.1), xytext=(1.5, 4.8), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))
    ax.text(1.7, 4.45, '1 : 1', ha='left', va='center', fontsize=7, color=MUTED_GRAY)

    # Connections RepairRequest -> Diagnosis & Recommendation
    ax.annotate('', xy=(5.1, 4.0), xytext=(7.5, 4.8), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))
    ax.annotate('', xy=(8.4, 4.0), xytext=(8.4, 4.8), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))

    # Row 3
    draw_entity(0.5, 0.7, 2.0, 1.4, 'RepairerSpecialization', '• id (PK, cuid)\n• repairerId (FK)\n• deviceCategory\n• brand, serviceType')
    draw_entity(3.8, 0.7, 2.4, 1.4, 'Quote', '• id (PK, cuid)\n• repairRequestId (FK)\n• repairerId (FK)\n• estimatedCost, days\n• status: QuoteStatus')
    draw_entity(7.2, 0.7, 2.4, 1.4, 'RepairJob', '• id (PK, cuid)\n• repairRequestId (1:1)\n• repairerId (FK), quoteId (1:1)\n• status: JobStatus\n• agreedCost, actualCost')

    # Connections Repairer -> Specialization & Quote
    ax.annotate('', xy=(1.5, 2.1), xytext=(1.5, 2.7), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))
    ax.annotate('', xy=(3.8, 1.4), xytext=(2.5, 3.2), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))

    # Connections Quote -> RepairJob
    ax.annotate('', xy=(7.2, 1.4), xytext=(6.2, 1.4), arrowprops=dict(arrowstyle="->", lw=1.2, color=MUTED_GRAY))
    ax.text(6.7, 1.55, '1 : 1', ha='center', va='bottom', fontsize=7, color=MUTED_GRAY)

    # Extra entities (Review & RepairHistory) on right/bottom
    ax.add_patch(patches.FancyBboxPatch((6.0, 0.1), 1.7, 0.45, boxstyle="round,pad=0.03", fc='#FEF3C7', ec=BORDER_COLOR, lw=1))
    ax.text(6.85, 0.32, 'Review (1:1 Job)', ha='center', va='center', fontsize=6.5, fontweight='bold')

    ax.add_patch(patches.FancyBboxPatch((8.0, 0.1), 1.8, 0.45, boxstyle="round,pad=0.03", fc='#F0FDF4', ec=BORDER_COLOR, lw=1))
    ax.text(8.9, 0.32, 'RepairHistory / Passport', ha='center', va='center', fontsize=6.5, fontweight='bold')

    plt.tight_layout()
    plt.savefig('docs/report_assets/figure4_er_diagram.png', dpi=300)
    plt.close()

# -----------------------------------------------------------------------------
# Figure 5: Marketplace Workflow
# -----------------------------------------------------------------------------
def generate_fig5():
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    ax.text(5, 4.6, 'Figure 5: Competitive Repair Marketplace & Lifecycle Workflow', 
            ha='center', va='center', fontsize=12, fontweight='bold', color=TEXT_COLOR)

    stages = [
        ('1. Request Filed', 'Owner submits device\nsymptom report', '#EFF6FF', ACCENT_BLUE),
        ('2. AI-Triage', '7-Factor scoring &\nstatutory verdict', '#FEF3C7', '#D97706'),
        ('3. Quote Bidding', 'Verified technicians\nsubmit price & days', '#FFF7ED', ACCENT_ORANGE),
        ('4. Quote Accepted', 'Customer accepts bid;\nJob created; others rejected', '#FEF08A', '#CA8A04'),
        ('5. Bench Execution', 'Diagnosing -> Parts ->\nRepairing -> Testing', '#F3E8FF', '#9333EA'),
        ('6. Passport Stamp', 'COMPLETED state stamps\nimmutable device ledger', '#F0FDF4', ACCENT_GREEN),
    ]

    box_w = 2.6
    box_h = 1.1

    # Row 1: 1 -> 2 -> 3
    coords_top = [(0.6, 2.8), (3.7, 2.8), (6.8, 2.8)]
    for i in range(3):
        title, desc, bg, border = stages[i]
        x, y = coords_top[i]
        ax.add_patch(patches.FancyBboxPatch((x, y), box_w, box_h, boxstyle="round,pad=0.08", fc=bg, ec=border, lw=1.2))
        ax.text(x + box_w/2, y + 0.75, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color=border)
        ax.text(x + box_w/2, y + 0.35, desc, ha='center', va='center', fontsize=7.5, color=TEXT_COLOR)
        if i < 2:
            ax.annotate('', xy=(coords_top[i+1][0], y + box_h/2), xytext=(x + box_w, y + box_h/2),
                        arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    # Down arrow from 3 to 4
    ax.annotate('', xy=(6.8 + box_w/2, 2.1), xytext=(6.8 + box_w/2, 2.8),
                arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    # Row 2: 6 <- 5 <- 4
    coords_bot = [(6.8, 0.9), (3.7, 0.9), (0.6, 0.9)]
    for i in range(3):
        title, desc, bg, border = stages[i+3]
        x, y = coords_bot[i]
        ax.add_patch(patches.FancyBboxPatch((x, y), box_w, box_h, boxstyle="round,pad=0.08", fc=bg, ec=border, lw=1.2))
        ax.text(x + box_w/2, y + 0.75, title, ha='center', va='center', fontsize=8.5, fontweight='bold', color=border)
        ax.text(x + box_w/2, y + 0.35, desc, ha='center', va='center', fontsize=7.5, color=TEXT_COLOR)
        if i < 2:
            ax.annotate('', xy=(coords_bot[i+1][0] + box_w, y + box_h/2), xytext=(x, y + box_h/2),
                        arrowprops=dict(arrowstyle="->", lw=1.5, color=MUTED_GRAY))

    plt.tight_layout()
    plt.savefig('docs/report_assets/figure5_marketplace_workflow.png', dpi=300)
    plt.close()

# -----------------------------------------------------------------------------
# Figure 6: Cloud Deployment & Security Topology
# -----------------------------------------------------------------------------
def generate_fig6():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    ax.text(5, 5.6, 'Figure 6: Production Cloud Deployment & Network Security Topology', 
            ha='center', va='center', fontsize=12, fontweight='bold', color=TEXT_COLOR)

    # 1. Internet Clients
    ax.add_patch(patches.FancyBboxPatch((0.5, 2.2), 1.8, 2.4, boxstyle="round,pad=0.08", fc='#EFF6FF', ec=ACCENT_BLUE, lw=1.3))
    ax.text(1.4, 4.1, 'Internet Clients', ha='center', va='center', fontsize=9, fontweight='bold', color=ACCENT_BLUE)
    ax.text(1.4, 3.2, 'Desktop / Mobile\nModern Browsers\n(Chrome, Safari, Firefox)\n\nStrict HttpOnly\nSession Cookies', ha='center', va='center', fontsize=7, color=TEXT_COLOR)

    # Arrow to Vercel Edge
    ax.annotate('', xy=(3.0, 3.4), xytext=(2.3, 3.4), arrowprops=dict(arrowstyle="->", lw=2, color=ACCENT_BLUE))
    ax.text(2.65, 3.6, 'TLS 1.3\nHTTPS', ha='center', va='bottom', fontsize=7, color=MUTED_GRAY)

    # 2. Vercel Cloud Runtime
    ax.add_patch(patches.FancyBboxPatch((3.0, 1.0), 4.2, 4.4, boxstyle="round,pad=0.1", fc='#FFF7ED', ec=ACCENT_ORANGE, lw=1.6))
    ax.text(5.1, 5.0, 'Vercel Serverless Platform (https://repairgraph.vercel.app)', ha='center', va='center', fontsize=9.5, fontweight='bold', color=ACCENT_ORANGE)

    # Edge Network
    ax.add_patch(patches.Rectangle((3.3, 3.9), 3.6, 0.8, fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(5.1, 4.4, 'Global Anycast Edge Network', ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(5.1, 4.1, 'DDoS Mitigation • Anycast Routing • Security Headers (HSTS, DENY)', ha='center', va='center', fontsize=6.5, color=MUTED_GRAY)

    # Serverless Runtime
    ax.add_patch(patches.Rectangle((3.3, 1.4), 3.6, 2.2, fc=BOX_BG, ec=BORDER_COLOR, lw=1))
    ax.text(5.1, 3.3, 'Node.js 24.x Serverless Runtime', ha='center', va='center', fontsize=8.5, fontweight='bold')
    ax.text(5.1, 2.4, '• Next.js 15 App Router & Turbopack\n• 21 Route Handler Files (/api/*)\n• In-Memory Sliding-Window Rate Limiter\n• Zod Schema Validation & Error Sanitizer\n• Prisma ORM Client (v6.4.1)\n• Zero Hardcoded Secrets (Env-Injected)', ha='center', va='center', fontsize=6.5, color=TEXT_COLOR)

    # Arrow to Neon
    ax.annotate('', xy=(8.0, 3.4), xytext=(7.2, 3.4), arrowprops=dict(arrowstyle="->", lw=2, color=ACCENT_GREEN))
    ax.text(7.6, 3.6, 'Pooled TLS\n(PgBouncer)', ha='center', va='bottom', fontsize=7, color=ACCENT_GREEN)

    # 3. Neon PostgreSQL
    ax.add_patch(patches.FancyBboxPatch((8.0, 1.6), 1.6, 3.6, boxstyle="round,pad=0.08", fc='#F0FDF4', ec=ACCENT_GREEN, lw=1.6))
    ax.text(8.8, 4.8, 'Neon Cloud\nPostgreSQL', ha='center', va='center', fontsize=9, fontweight='bold', color=ACCENT_GREEN)
    ax.text(8.8, 3.3, '• Managed Cloud DB\n• PostgreSQL 16+\n• Automated Pooling\n• Scaled Storage\n• 0_init Migration\n• TLS Encrypted\n• ACID Guarantees', ha='center', va='center', fontsize=6.5, color=TEXT_COLOR)

    plt.tight_layout()
    plt.savefig('docs/report_assets/figure6_deployment_topology.png', dpi=300)
    plt.close()

if __name__ == '__main__':
    print("Generating Figure 1...")
    generate_fig1()
    print("Generating Figure 2...")
    generate_fig2()
    print("Generating Figure 3...")
    generate_fig3()
    print("Generating Figure 4...")
    generate_fig4()
    print("Generating Figure 5...")
    generate_fig5()
    print("Generating Figure 6...")
    generate_fig6()
    print("All 6 figures generated successfully in docs/report_assets/")
