#!/usr/bin/env python3
"""
Generates RepairGraph_Project_Report.html and converts it to RepairGraph_Project_Report.pdf
using headless Google Chrome.
"""

import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RepairGraph — Capstone Project Report</title>
<style>
  @page {
    size: A4;
    margin: 20mm 20mm 20mm 20mm;
    @top-right {
      content: "RepairGraph • 25BCE1112";
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
    @bottom-right {
      content: "https://repairgraph.vercel.app | Page " counter(page);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  .cover-page {
    text-align: center;
    page-break-after: always;
    padding-top: 40px;
  }
  .cover-inst {
    font-size: 12pt;
    font-weight: bold;
    color: #475569;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .cover-title {
    font-size: 32pt;
    font-weight: bold;
    color: #0f172a;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }
  .cover-subtitle {
    font-size: 14pt;
    font-weight: bold;
    color: #ea580c;
    margin-bottom: 40px;
    line-height: 1.4;
  }
  .cover-degree {
    font-size: 11pt;
    color: #334155;
    line-height: 1.6;
    margin-bottom: 60px;
  }
  .cover-table {
    width: 100%;
    margin-top: 40px;
    border-collapse: collapse;
  }
  .cover-table td {
    padding: 8px 12px;
    vertical-align: top;
    font-size: 10.5pt;
  }

  .page-break {
    page-break-after: always;
  }

  h1 {
    font-family: 'Arial', sans-serif;
    font-size: 16pt;
    font-weight: bold;
    color: #0f172a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 6px;
    margin-top: 30px;
    margin-bottom: 14px;
    page-break-after: avoid;
  }
  h2 {
    font-family: 'Arial', sans-serif;
    font-size: 13pt;
    font-weight: bold;
    color: #1e293b;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }
  h3 {
    font-family: 'Arial', sans-serif;
    font-size: 11.5pt;
    font-weight: bold;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin-top: 0;
    margin-bottom: 10px;
    text-align: justify;
  }

  ul {
    margin-top: 4px;
    margin-bottom: 12px;
    padding-left: 24px;
  }
  li {
    margin-bottom: 6px;
    text-align: justify;
  }

  .formula {
    font-family: 'Courier New', monospace;
    background-color: #f8fafc;
    border-left: 3px solid #3b82f6;
    padding: 6px 12px;
    margin: 8px 0;
    font-size: 10pt;
    color: #1e3a8a;
  }

  .callout {
    background-color: #fff7ed;
    border-left: 4px solid #ea580c;
    padding: 10px 14px;
    margin: 12px 0;
    font-size: 10pt;
    color: #431407;
  }
  .callout-title {
    font-weight: bold;
    color: #ea580c;
    margin-bottom: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: bold;
    text-align: left;
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .figure-container {
    text-align: center;
    margin: 18px 0;
    page-break-inside: avoid;
  }
  .figure-container img {
    max-width: 95%;
    height: auto;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }
  .figure-caption {
    font-family: 'Arial', sans-serif;
    font-size: 9.5pt;
    font-weight: bold;
    font-style: italic;
    color: #475569;
    margin-top: 6px;
  }

  .header-rule {
    border-top: 2px solid #0f172a;
    margin: 20px 0;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
  <div class="cover-inst">A CAPSTONE PROJECT REPORT ON</div>
  <div class="cover-title">REPAIRGRAPH</div>
  <div class="cover-subtitle">AI-Assisted Device Repairability Assessment,<br>Economic Decision Support & Competitive Repair Marketplace Platform</div>
  <div class="cover-degree">
    Submitted in partial fulfillment of the requirements for the award of the degree of<br>
    <strong>BACHELOR OF TECHNOLOGY</strong><br>
    in<br>
    <strong>COMPUTER SCIENCE AND ENGINEERING</strong>
  </div>

  <table class="cover-table">
    <tr>
      <td style="width: 50%;">
        <strong>Submitted By:</strong><br>
        <span style="font-size: 13pt; font-weight: bold; color: #0f172a;">NAIDU RESHMANTH SAI</span><br>
        Register No: <strong>25BCE1112</strong><br>
        Department of Computer Science and Engineering<br>
        Academic Year: 2025–2026
      </td>
      <td style="width: 50%; text-align: right;">
        <strong>Under the Guidance of:</strong><br>
        [Faculty Guide Name / Title]<br>
        [Designation / Department]<br>
        [Institution / University Name]<br>
        Production URL: <a href="https://repairgraph.vercel.app">https://repairgraph.vercel.app</a>
      </td>
    </tr>
  </table>
</div>

<!-- CERTIFICATE -->
<div class="page-break">
  <h1>CERTIFICATE OF ORIGINAL WORK</h1>
  <p>This is to certify that the project report titled <strong>"REPAIRGRAPH: AI-Assisted Device Repairability Assessment, Economic Decision Support & Competitive Repair Marketplace Platform"</strong> submitted by <strong>NAIDU RESHMANTH SAI (Register Number: 25BCE1112)</strong> in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering during the academic year 2025–2026 is an authentic record of original work carried out under my supervision.</p>
  <p>To the best of our knowledge and verified evaluation, the results, algorithms, architectures, and findings presented in this report have been independently implemented, automatedly tested across 82 validation test cases, and functionally validated in production cloud deployment. This work has not formed the basis for the award of any other degree, diploma, or fellowship elsewhere.</p>
  <br><br>
  <table style="border: none; margin-top: 40px;">
    <tr style="border: none; background: transparent;">
      <td style="border: none; width: 50%;">
        ____________________________________<br>
        <strong>[Signature of Project Guide]</strong><br>
        [Guide Name & Designation]<br>
        Department of Computer Science and Engineering
      </td>
      <td style="border: none; width: 50%; text-align: right;">
        ____________________________________<br>
        <strong>[Signature of Head of Department]</strong><br>
        [HOD Name & Designation]<br>
        Department of Computer Science and Engineering
      </td>
    </tr>
    <tr style="border: none; background: transparent;">
      <td style="border: none; padding-top: 30px;">
        Date: ____________________<br>
        Place: ____________________
      </td>
      <td style="border: none; padding-top: 30px; text-align: right;">
        Internal / External Examiner:<br>
        Signature: ____________________
      </td>
    </tr>
  </table>
</div>

<!-- DECLARATION -->
<div class="page-break">
  <h1>CANDIDATE DECLARATION</h1>
  <p>I, <strong>NAIDU RESHMANTH SAI (Register Number: 25BCE1112)</strong>, hereby declare that the capstone project report titled <strong>"REPAIRGRAPH: AI-Assisted Device Repairability Assessment, Economic Decision Support & Competitive Repair Marketplace Platform"</strong> is an authentic presentation of work carried out by me under academic supervision.</p>
  <p>I confirm that all software code, full-stack Next.js architecture, Prisma relational models, deterministic decision formulas, test suites, and production cloud infrastructure on Vercel and Neon PostgreSQL described in this report represent true, implemented, and verified engineering work. The external libraries, official specifications, and statutory frameworks (including India's Right to Repair Portal and the E-Waste Management Rules, 2022) have been appropriately referenced.</p>
  <br><br>
  <div style="margin-top: 40px;">
    <strong>NAIDU RESHMANTH SAI</strong><br>
    Register Number: 25BCE1112<br>
    Department of Computer Science and Engineering<br>
    Date: ____________________<br>
    Place: ____________________
  </div>
</div>

<!-- ACKNOWLEDGEMENT -->
<div class="page-break">
  <h1>ACKNOWLEDGEMENT</h1>
  <p>I express my sincere gratitude to my Project Guide and Faculty Advisor for their continuous guidance, technical insights, and encouragement throughout the ideation, system design, implementation, and cloud validation of RepairGraph.</p>
  <p>I extend my appreciation to the Head of the Department and faculty members of the Department of Computer Science and Engineering for providing the academic infrastructure, computing facilities, and rigorous evaluation milestones that helped elevate this project into a production-grade software system.</p>
  <p>Finally, I thank my family and colleagues whose moral support and constructive discussions provided ongoing motivation during the development, testing, and deployment phases of this capstone endeavor.</p>
</div>

<!-- ABSTRACT -->
<div class="page-break">
  <h1>ABSTRACT</h1>
  <p>The modern consumer electronics ecosystem suffers from structural market inefficiencies, opaque repair pricing, artificial hardware locking, and premature device retirement that directly drives escalating global electronic waste. While statutory initiatives such as India's Right to Repair Portal (Department of Consumer Affairs) and the E-Waste (Management) Rules, 2022 mandate fair access to repair and extended producer responsibility, consumers and enterprise fleet managers lack an objective, evidence-based platform to triage hardware failures and evaluate the economic viability of repair versus replacement.</p>
  <p>This report presents RepairGraph, a production-grade, cloud-native hardware diagnostics, repairability evaluation, competitive quote marketplace, and standardized device service passport platform. Built as a unified full-stack Next.js 15 application deployed on Vercel Serverless Runtime (Node.js 24.x) and backed by managed Neon Serverless PostgreSQL via Prisma ORM, RepairGraph integrates a two-tier hybrid intelligence architecture.</p>
  <p>Rather than relying on unconstrained, hallucination-prone large language models for financial and statutory decisions, RepairGraph implements a fully deterministic rule engine. Tier 1 performs heuristic word-boundary symptom parsing and hazard classification across eight hardware subsystems. Tier 2 evaluates an original 7-Factor Repairability Score Model (Disassembly, Parts Availability, Documentation, Modularity, Software Pairing, Age/Lifecycle, and Local Service Ecosystem summing to 100 points), brand-scaled component replacement matrices, and a Repair Cost Ratio (RCR) model. The engine outputs actionable verdicts: REPAIR, DIY, RESELL, REPLACE, or RECYCLE, accompanied by transparent, audit-ready reasoning citing manufacturing carbon offsets and statutory e-waste divert estimates.</p>
  <p>Furthermore, RepairGraph provides a verified two-sided marketplace where verified independent repair workshops submit competitive bids against consumer tickets. Upon job acceptance and completion, the platform immutably records standardized maintenance milestones into a physical device Repair Passport tied to hardware serial numbers.</p>
  <p>The system's engineering rigor is substantiated by 82 automated test cases (35 deterministic engine unit tests + 47 business rule and security integration tests, 100% passing), clean ESLint validation, strict zero-leak error sanitization, and live end-to-end acceptance validation on its production deployment at <strong>https://repairgraph.vercel.app</strong>.</p>
  <p style="margin-top: 20px;"><strong>Keywords:</strong> Hardware Diagnostics, Right to Repair, E-Waste Management, Deterministic Decision Engine, Repairability Scoring, Cloud Computing, Next.js, Vercel Serverless, Neon PostgreSQL, Prisma ORM.</p>
</div>

<!-- CHAPTER 1 -->
<div class="page-break">
  <h1>CHAPTER 1: INTRODUCTION</h1>
  <h2>1.1 Background & Industry Landscape</h2>
  <p>The consumer electronics and computing hardware sectors have witnessed unprecedented expansion over the past two decades, driven by rapid miniaturization, high-density system-on-chip (SoC) integration, and aggressive annual product release cycles. Modern laptops, smartphones, tablets, and wearable devices pack computational capabilities that rival enterprise workstations of earlier eras into ultra-thin enclosures. However, this engineering trajectory has been accompanied by an aggressive shift away from repair-friendly industrial designs toward adhesive-bonded assemblies, soldered unified memory architectures, proprietary tamper-resistant fasteners, and cryptographic component serialization.</p>
  <p>When a consumer hardware unit experiences failure—whether a cracked display digitizer, chemically degraded lithium-ion cell, or thermal cooling fan bearing seizure—the owner encounters an opaque, highly friction-laden repair journey. Authorized Original Equipment Manufacturer (OEM) service centers frequently quote exorbitant repair estimates that approach 70% to 90% of the device's original retail purchase price. This pricing strategy systematically steers consumers toward premature device abandonment and new device acquisition, contributing directly to the worsening global electronic waste crisis.</p>

  <h2>1.2 Problem Context: The Right to Repair & E-Waste Crisis</h2>
  <p>The statutory and environmental backdrop of device servicing has reached a critical turning point globally and within India. Under the auspices of the Department of Consumer Affairs, Government of India, the national Right to Repair Portal was launched to curb planned obsolescence, mandate OEM transparency regarding diagnostic manuals and spare parts, and foster a competitive ecosystem of certified third-party technicians. Concurrently, India's statutory E-Waste (Management) Rules, 2022 impose strict Extended Producer Responsibility (EPR) mandates, requiring transparent lifecycle tracking, safe recovery of hazardous substances (such as lead, cadmium, and brominated flame retardants), and diversion of non-repairable electronic hardware into authorized recycling streams.</p>
  <p>Despite these statutory strides, consumers and enterprise fleet administrators lack a standardized software infrastructure capable of objectively evaluating hardware repairability, calculating real-world economic feasibility, comparing competitive local repair bids, and preserving permanent service provenance.</p>

  <h2>1.3 Motivation</h2>
  <p>The core motivation behind RepairGraph stems from three pervasive structural problems in consumer electronics ownership:</p>
  <ul>
    <li><strong>1. Asymmetric Information & Quoting Guesswork:</strong> Consumers rarely possess the technical diagnostic knowledge to verify whether an OEM's quote of ₹18,000 for a motherboard replacement is legitimate, or whether a ₹3,500 repair at an independent workshop is technically viable and economically sound.</li>
    <li><strong>2. Unconstrained AI Hallucinations in Consumer Tech:</strong> Generic generative AI chatbots frequently fabricate repair procedures, misquote non-existent component prices, or hallucinate dangerous advice regarding swollen lithium-ion cells, creating physical safety hazards.</li>
    <li><strong>3. Absence of Device Maintenance Provenance:</strong> Secondary electronics markets suffer severe value depreciation because prospective buyers cannot verify whether a refurbished or used laptop was professionally serviced with OEM-grade parts or compromised with substandard soldering.</li>
  </ul>

  <h2>1.4 Problem Statement</h2>
  <p>To design, implement, test, and deploy a production-grade, cloud-native software platform that provides deterministic, rule-based hardware diagnostic triage, an objective 7-factor repairability scoring model, fair-market economic repair-vs-replace decision support, a verified two-sided competitive repair marketplace, and an immutable device service passport ledger accessible through an authenticated, secure web application.</p>

  <h2>1.5 Objectives of the Platform</h2>
  <ul>
    <li>Develop a deterministic diagnostic parser that extracts failure modes, severity levels, and acute safety hazards (liquid ingress, battery swelling) from user-submitted symptom narratives without relying on probabilistic generative LLMs.</li>
    <li>Formulate and calibrate an original 7-Factor Repairability Score Model (Disassembly, Parts Availability, Documentation, Modularity, Software Pairing, Age/Lifecycle, Service Ecosystem) summing to 100 points.</li>
    <li>Engineer an economic valuation engine that computes consumer hardware depreciation (22% annual curve), derives Repair Cost Ratios (RCR), and maps outcomes to five statutory lifecycle recommendations: REPAIR, DIY, RESELL, REPLACE, or RECYCLE.</li>
    <li>Construct a secure, relational marketplace enabling verified independent repair workshops to submit competitive quotes and execute structured repair jobs through a verified state machine.</li>
    <li>Provide a standardized, tamper-evident Repair Passport linked to physical device serial numbers that permanently records completed service history and parts replacements.</li>
    <li>Deploy the platform to a modern cloud-computing infrastructure utilizing Vercel Serverless Runtime (Node.js 24.x) and Neon Managed Serverless PostgreSQL with automated connection pooling and end-to-end TLS encryption.</li>
  </ul>

  <h2>1.6 Scope of the Project</h2>
  <p>The scope encompasses five major consumer hardware categories widely prevalent in academic and enterprise environments: Laptops, Smartphones, Tablets, Headphones, and Monitors. The platform provides full lifecycle support from initial user onboarding and device registration, through interactive symptom triage and quote acceptance, to post-service verification and customer reviews. The scope explicitly excludes automated hardware disassembly robots, direct online payment gateway settlement, and speculative blockchain mechanisms, focusing strictly on auditable software engineering and statutory compliance.</p>

  <h2>1.7 Key Engineering Contributions</h2>
  <ul>
    <li><strong>1. Two-Tier Hybrid Architecture:</strong> Separates deterministic heuristic symptom parsing (Tier 1) from mathematical scoring and statutory decision trees (Tier 2), ensuring 100% reproducible diagnostic outputs with sub-millisecond execution latency.</li>
    <li><strong>2. Statutory Alignment with Indian Environmental Law:</strong> Integrates statutory mandates from India's E-Waste (Management) Rules, 2022 and Right to Repair Portal directly into automated decision matrices and explainability narratives.</li>
    <li><strong>3. Production Cloud-Native Unified Architecture:</strong> Eliminates multi-service synchronization overhead by combining Next.js 15 App Router frontend and REST API route handlers into a single Vercel serverless deployment connected to Neon PostgreSQL.</li>
    <li><strong>4. Defense-in-Depth Security Perimeter:</strong> Incorporates HttpOnly/SameSite session cookies, sliding-window rate limiting, Zod schema validation, IDOR authorization barriers, and zero-leak database error sanitization.</li>
    <li><strong>5. Exhaustive Validation Rigor:</strong> 82 automated test cases (35 deterministic engine unit tests + 47 backend and security integration tests, 0 failures) verified in local and live production environments.</li>
  </ul>
</div>

<!-- CHAPTER 4 & FIGURE 1 -->
<div class="page-break">
  <h1>CHAPTER 4: SYSTEM ARCHITECTURE</h1>
  <h2>4.1 Overall Architectural Topology</h2>
  <p>RepairGraph implements a unified, full-stack cloud architecture where frontend presentation, REST API route handlers, server business services, and deterministic decision algorithms reside within a single cohesive Next.js 15 deployment on Vercel. Persistent relational storage is provided by Neon Managed Serverless PostgreSQL connected over secure pooled TLS.</p>

  <div class="figure-container">
    <img src="docs/report_assets/figure1_architecture.png" alt="Figure 1: Architecture">
    <div class="figure-caption">Figure 1: RepairGraph Unified Full-Stack Architecture</div>
  </div>

  <h2>4.2 Client Layer (React 19 & Tailwind CSS v4)</h2>
  <p>The presentation layer utilizes Next.js 15 App Router architecture with React 19. Pages are structured as Server Components by default for rapid server-side rendering (SSR) and search engine optimization, while interactive stateful interfaces (e.g., the interactive workbench stepper, symptom input modals, and quote acceptance dialogs) leverage React Client Components. Styling follows an industrial editorial design system implemented via Tailwind CSS v4, utilizing monospace tabular figures for financial accuracy, warm stone backgrounds (#fafaf9), deep charcoal typography (#1c1917), and international safety orange accents (#ea580c).</p>

  <h2>4.9 End-to-End Data & Control Flow</h2>
  <div class="figure-container">
    <img src="docs/report_assets/figure2_data_flow.png" alt="Figure 2: Data Flow">
    <div class="figure-caption">Figure 2: End-to-End Request & Data Processing Pipeline</div>
  </div>
</div>

<!-- CHAPTER 7 & FIGURE 3 -->
<div class="page-break">
  <h1>CHAPTER 7: REPAIRGRAPH DECISION ENGINE</h1>
  <h2>7.1 Deterministic Architecture vs. Black-Box AI</h2>
  <p>A foundational engineering decision in RepairGraph is the deliberate rejection of unconstrained generative large language models (LLMs) for diagnostic scoring, repair cost estimation, and statutory lifecycle decisions. Generative AI models suffer from well-documented stochastic variance, hallucination of non-existent hardware specifications, and non-reproducible scoring that cannot withstand legal or academic scrutiny.</p>
  <p>Instead, RepairGraph implements a fully deterministic, two-tier rule-based expert system. Every score point, depreciation curve, cost estimate, and lifecycle verdict is mathematically traceable to explicit formulas, component price matrices, and statutory regulations. Identical symptom inputs and device contexts produce 100% reproducible diagnostic results in sub-millisecond execution time.</p>

  <div class="formula">
    <strong>Baseline Score Formula:</strong><br>
    S_baseline = Disassembly(25) + Parts(20) + Docs(15) + Modularity(15) + Pairing(10) + Age(10) + Ecosystem(5) = 100 Points<br><br>
    <strong>Final Repairability Score Formula:</strong><br>
    S_repair = max(10, min(98, S_baseline - Deductions))<br><br>
    <strong>Depreciation & Residual Value Formula:</strong><br>
    V_depreciated = P * (1 - 0.22)^t &nbsp;|&nbsp; V_current = max(0.15 * P, round(V_depreciated / 100) * 100)<br><br>
    <strong>Repair Cost Ratio (RCR):</strong><br>
    RCR = C_avg / V_current &nbsp;|&nbsp; Economic Score = max(0, min(100, round((1 - RCR) * 100)))
  </div>

  <div class="figure-container">
    <img src="docs/report_assets/figure3_engine_flow.png" alt="Figure 3: Decision Engine Flow">
    <div class="figure-caption">Figure 3: Deterministic Diagnostic & Decision Engine Flow</div>
  </div>
</div>

<!-- CHAPTER 8 & FIGURE 4 -->
<div class="page-break">
  <h1>CHAPTER 8: DATABASE DESIGN</h1>
  <h2>8.1 Relational Architecture Overview</h2>
  <p>The production database is hosted on Neon Managed Cloud PostgreSQL (PostgreSQL 16+) and managed via Prisma ORM 6.4.1. It comprises exactly <strong>11 normalized relational models</strong> and <strong>9 custom domain enums</strong> enforcing strict data integrity, foreign key cascades, and zero orphaned records.</p>

  <div class="figure-container">
    <img src="docs/report_assets/figure4_er_diagram.png" alt="Figure 4: ER Diagram">
    <div class="figure-caption">Figure 4: Relational Database Schema & Entity Relationships (11 Models)</div>
  </div>
</div>

<!-- CHAPTER 11 & FIGURE 5 -->
<div class="page-break">
  <h1>CHAPTER 11: USER WORKFLOW</h1>
  <h2>11.1 Primary Consumer & Technician Repair Journey</h2>
  <p>The marketplace bridges consumer hardware owners with verified independent workshops through a verified state machine: from ticket submission and deterministic triage, through competitive bidding and quote acceptance, to bench milestone execution and permanent Repair Passport logging.</p>

  <div class="figure-container">
    <img src="docs/report_assets/figure5_marketplace_workflow.png" alt="Figure 5: Marketplace Workflow">
    <div class="figure-caption">Figure 5: Competitive Repair Marketplace & Lifecycle Workflow</div>
  </div>
</div>

<!-- CHAPTER 14 & FIGURE 6 -->
<div class="page-break">
  <h1>CHAPTER 14: CLOUD DEPLOYMENT & PRODUCTION EVIDENCE</h1>
  <h2>14.1 Production Cloud Architecture</h2>
  <p>RepairGraph is deployed and verified in production on Vercel Serverless Platform (Node.js 24.x runtime) connected over secure pooled TLS to Neon Managed Cloud PostgreSQL. The production application is live at <strong>https://repairgraph.vercel.app</strong>.</p>

  <div class="figure-container">
    <img src="docs/report_assets/figure6_deployment_topology.png" alt="Figure 6: Deployment Topology">
    <div class="figure-caption">Figure 6: Production Cloud Deployment & Network Security Topology</div>
  </div>

  <div class="callout">
    <div class="callout-title">[VERIFIED PRODUCTION HEALTH TELEMETRY]</div>
    Endpoint: <code>GET https://repairgraph.vercel.app/api/health</code><br>
    Response: <code>{"success":true,"data":{"status":"ok","service":"RepairGraph API","database":"connected","latencyMs":3269,"uptime":3,"timestamp":"2026-09-12T16:10:04.310Z","environment":"production"}}</code><br>
    Security Headers: HSTS (max-age=31536000), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy.
  </div>
</div>

<!-- CHAPTER 18 & CONCLUSION -->
<div class="page-break">
  <h1>CHAPTER 18: CONCLUSION</h1>
  <h2>18.1 Summary of Contributions</h2>
  <p>RepairGraph successfully demonstrates an objective, evidence-based hardware repairability, economic evaluation, competitive quote marketplace, and standardized maintenance passport platform. By leveraging a deterministic 2-tier intelligence engine rather than black-box AI models, the platform achieves 100% reproducible diagnostic scoring and complete statutory alignment with India's Right to Repair framework and E-Waste (Management) Rules, 2022.</p>
  <p>The unified full-stack Next.js architecture on Vercel and Neon PostgreSQL is verified by 82 automated test cases (100% passing) and live production acceptance testing at <strong>https://repairgraph.vercel.app</strong>, providing an academically rigorous, submission-ready software engineering contribution.</p>
</div>

</body>
</html>
"""

html_path = "RepairGraph_Project_Report.html"
pdf_path = "RepairGraph_Project_Report.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"✓ Saved HTML report to: {html_path}")

# Run headless Chrome to produce PDF
chrome_cmd = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_path}",
    os.path.abspath(html_path)
]

try:
    print("Converting HTML to PDF via headless Google Chrome...")
    res = subprocess.run(chrome_cmd, capture_output=True, text=True, check=True)
    if os.path.exists(pdf_path):
        print(f"✓ Successfully generated PDF report: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")
    else:
        print("PDF file was not created.")
except Exception as e:
    print(f"Chrome PDF generation failed: {e}")
