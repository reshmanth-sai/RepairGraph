import { RecommendedAction } from '@prisma/client';
import { DiagnosticSignals, DeviceContext, ScoringResult, DecisionResult } from './types';

export function determineLifecycleAction(
  device: DeviceContext,
  signals: DiagnosticSignals,
  scoring: ScoringResult
): DecisionResult {
  const { repairabilityScore, economicScore, repairCostRatio, estimatedCostMin, estimatedCostMax, ageYears } = scoring;

  let action: RecommendedAction;

  // Catastrophic failure check
  const isCatastrophic =
    (signals.liquidDamage && signals.powerFailure) ||
    (signals.primaryComponent === 'LOGIC_BOARD' && repairCostRatio > 0.85) ||
    repairCostRatio > 0.92;

  if (isCatastrophic) {
    action = RecommendedAction.RECYCLE;
  } else if (
    signals.diyFeasible &&
    repairabilityScore >= 72 &&
    repairCostRatio <= 0.28
  ) {
    action = RecommendedAction.DIY;
  } else if (repairCostRatio <= 0.52 && repairabilityScore >= 42) {
    action = RecommendedAction.REPAIR;
  } else if (repairCostRatio > 0.50 && repairCostRatio <= 0.75 && !signals.powerFailure) {
    action = RecommendedAction.RESELL;
  } else if (repairCostRatio > 0.75 || ageYears >= 6 || repairabilityScore < 35) {
    action = RecommendedAction.REPLACE;
  } else {
    // Default fallback to professional repair if borderline
    action = repairabilityScore >= 45 ? RecommendedAction.REPAIR : RecommendedAction.REPLACE;
  }

  // Compile explainable reasoning bullets
  const reasoning = generateExplanation(action, device, signals, scoring);

  return {
    recommendedAction: action,
    repairabilityScore,
    economicScore,
    estimatedCostMin,
    estimatedCostMax,
    reasoning,
    signals,
    scoring,
  };
}

function generateExplanation(
  action: RecommendedAction,
  device: DeviceContext,
  signals: DiagnosticSignals,
  scoring: ScoringResult
): string {
  const bullets: string[] = [];
  const curVal = Math.round(device.currentValue || (scoring.estimatedCostAvg / (scoring.repairCostRatio || 0.5)));
  const percentage = Math.round(scoring.repairCostRatio * 100);

  // 1. Economic verdict
  switch (action) {
    case 'DIY':
      bullets.push(
        `Economic Assessment: Estimated module replacement cost (₹${scoring.estimatedCostMin.toLocaleString()} - ₹${scoring.estimatedCostMax.toLocaleString()}) represents ~${percentage}% of the device's current value (₹${curVal.toLocaleString()}), making end-user replacement exceptionally cost-effective.`
      );
      break;
    case 'REPAIR':
      bullets.push(
        `Economic Assessment: Estimated professional repair cost (₹${scoring.estimatedCostMin.toLocaleString()} - ₹${scoring.estimatedCostMax.toLocaleString()}) represents ~${percentage}% of current device market value (₹${curVal.toLocaleString()}), well below the 50% economic replacement ceiling.`
      );
      break;
    case 'RESELL':
      bullets.push(
        `Economic Assessment: Projected repair expenses (~${percentage}% of device value) approach marginal utility. Liquidating or trading in this hardware retains higher recovery value compared to full restoration.`
      );
      break;
    case 'REPLACE':
      bullets.push(
        `Economic Assessment: Repair cost ratio of ${percentage}% exceeds prudent thresholds for a ${scoring.ageYears.toFixed(1)}-year-old device. Capital is more effectively deployed toward an updated system with active security support.`
      );
      break;
    case 'RECYCLE':
      bullets.push(
        `Economic Assessment: Hardware has suffered multi-rail failure or severe liquid damage where repair costs (~${percentage}%) exceed recoverable residual worth.`
      );
      break;
  }

  // 2. Technical feasibility & supply chain
  if (action === 'DIY') {
    bullets.push(
      `Technical Feasibility: ${device.brand} ${device.model} features accessible internal architecture (Modularity Index: ${scoring.modularityIndex}/100). The ${signals.primaryComponent.toLowerCase()} module can be safely detached and swapped with standard Torx/spudger hand tools.`
    );
  } else if (action === 'REPAIR') {
    bullets.push(
      `Technical Feasibility: Replacement ${signals.primaryComponent.toLowerCase()} assemblies possess high aftermarket supply availability (Score: ${scoring.partsAvailabilityIndex}/100). Standard repair turnaround requires 1–3 business days without board-level micro-soldering.`
    );
  } else if (action === 'RECYCLE') {
    bullets.push(
      `Technical Feasibility: High likelihood of latent electrochemical oxidation and board substrate delamination, rendering partial fixes unreliable.`
    );
  } else {
    bullets.push(
      `Technical Feasibility: Repair complexity index (${scoring.repairabilityScore}/100) indicates elevated labor overhead relative to remaining operational lifespan.`
    );
  }

  // 3. Environmental & regulatory impact (India E-Waste 2022)
  if (action === 'REPAIR' || action === 'DIY') {
    const co2Saved = Math.round(device.category === 'LAPTOP' ? 180 : 36);
    const gramsSaved = Math.round(device.category === 'LAPTOP' ? 1400 : 180);
    bullets.push(
      `Environmental Impact: Servicing this unit extends physical lifecycle by an estimated 18–36 months, preventing ~${co2Saved} kg of CO₂e manufacturing emissions and diverting ${gramsSaved}g of electronic waste under India's E-Waste (Management) Rules, 2022.`
    );
  } else if (action === 'RECYCLE') {
    bullets.push(
      `Environmental Impact: Compliant with India E-Waste (Management) Rules, 2022: Channeling this non-viable device through authorized EPR-registered recyclers ensures safe recovery of precious metals and prevents toxic lead/cadmium contamination.`
    );
  } else {
    bullets.push(
      `Lifecycle Optimization: Refurbishing or trading in salvageable components enables downstream circular reuse, mitigating raw mineral extraction for new hardware.`
    );
  }

  return bullets.join('\n\n');
}
