import { DeviceContext, DecisionResult } from './types';
import { extractDiagnosticSignals } from './symptomExtractor';
import { calculateScores } from './scoringEngine';
import { determineLifecycleAction } from './decisionEngine';

export * from './types';
export * from './symptomExtractor';
export * from './costMatrix';
export * from './scoringEngine';
export * from './decisionEngine';

/**
 * Unified Two-Tier Diagnostic & Decision Pipeline
 *
 * Tier 1: Extracts structured diagnostic signals and failure modes from symptom text.
 * Tier 2: Computes deterministic repairability score, repair cost ratio, economic score,
 *         and outputs lifecycle action with defensible explanations.
 */
export function diagnoseAndRecommend(
  device: DeviceContext,
  description: string
): DecisionResult {
  // Tier 1: Deterministic Rule-Based Symptom & Signal Extraction
  const signals = extractDiagnosticSignals(description, device.category, device.brand);

  // Tier 2A: Mathematical Scoring & Cost Estimation
  const scoring = calculateScores(device, signals);

  // Tier 2B: Deterministic Lifecycle Action & Explainable Reasoning
  return determineLifecycleAction(device, signals, scoring);
}
