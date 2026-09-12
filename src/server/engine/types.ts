import { DeviceCategory, RecommendedAction } from '@prisma/client';

export type ComponentType =
  | 'DISPLAY'
  | 'BATTERY'
  | 'CHARGING_PORT'
  | 'LOGIC_BOARD'
  | 'CAMERA'
  | 'KEYBOARD'
  | 'AUDIO'
  | 'STORAGE'
  | 'GENERAL';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DiagnosticSignals {
  issueCategory: string;
  possibleIssue: string;
  confidence: number; // 0 to 100
  evidence: string[];
  primaryComponent: ComponentType;
  secondaryComponent?: ComponentType;
  severity: IssueSeverity;
  diyFeasible: boolean;
  liquidDamage: boolean;
  powerFailure: boolean;
}

export interface DeviceContext {
  id: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  purchasePrice?: number | null;
  currentValue?: number | null;
  purchaseDate?: Date | null;
  condition: string;
}

export interface FactorScore {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  benchmark: string;
  notes?: string;
}

export interface RepairabilityFactors {
  disassembly: FactorScore;       // Max: 25
  partsAvailability: FactorScore; // Max: 20
  documentation: FactorScore;     // Max: 15
  modularity: FactorScore;        // Max: 15
  softwarePairing: FactorScore;   // Max: 10
  ageAndSupport: FactorScore;     // Max: 10
  serviceEcosystem: FactorScore;  // Max: 5
}

export interface ScoringResult {
  repairabilityScore: number; // 0 to 100 (incident-adjusted)
  baselineScore: number;      // 0 to 100 (sum of 7 design factors)
  penalties: { amount: number; reasons: string[] };
  economicScore: number;      // 0 to 100
  repairCostRatio: number;   // C_repair / V_current
  estimatedCostMin: number;
  estimatedCostMax: number;
  estimatedCostAvg: number;
  factors: RepairabilityFactors;
  partsAvailabilityIndex: number; // 0-100 normalized
  modularityIndex: number;        // 0-100 normalized
  documentationIndex: number;     // 0-100 normalized
  ageYears: number;
}

export interface DecisionResult {
  recommendedAction: RecommendedAction;
  repairabilityScore: number;
  economicScore: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  reasoning: string;
  signals: DiagnosticSignals;
  scoring: ScoringResult;
}
