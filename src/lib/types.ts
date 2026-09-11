export type DeviceCategory = 'laptop' | 'smartphone' | 'tablet' | 'audio' | 'monitor';

export type DeviceCondition = 'excellent' | 'good' | 'fair' | 'degraded' | 'critical';

export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'unregistered';

export type RepairStatus = 'none' | 'issue_reported' | 'diagnosing' | 'in_repair' | 'repaired';

export type LifecycleAction = 'repair' | 'diy' | 'authorized_service' | 'resell' | 'recycle';

export interface RepairabilityFactor {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  benchmark: string;
  notes: string;
}

export interface RepairabilityDetail {
  overallScore: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  summary: string;
  factors: RepairabilityFactor[];
}

export interface ActiveIssue {
  id: string;
  title: string;
  reportedAt: string;
  category: 'thermal' | 'battery' | 'display' | 'chassis' | 'logic_board' | 'port';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  symptoms: string[];
  diagnosticConfidence: number;
  estimatedCostMinINR: number;
  estimatedCostMaxINR: number;
  recommendedAction: LifecycleAction;
  recommendationReasoning: string;
  activeJobId?: string;
}

export interface Device {
  id: string;
  brand: string;
  model: string;
  modelCode: string;
  category: DeviceCategory;
  serialNumber: string;
  purchaseDate: string;
  purchasePriceINR: number;
  fairMarketValueINR: number;
  condition: DeviceCondition;
  warrantyStatus: WarrantyStatus;
  warrantyExpiry: string;
  repairStatus: RepairStatus;
  lastActivityDate: string;
  repairabilityScore: number;
  repairabilityDetail: RepairabilityDetail;
  specs: Record<string, string>;
  activeIssue?: ActiveIssue;
}

export interface RepairJob {
  id: string;
  deviceId: string;
  deviceModel: string;
  issueTitle: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DIAGNOSING' | 'WAITING_FOR_PART' | 'REPAIRING' | 'TESTING' | 'COMPLETED';
  technician: {
    name: string;
    businessName: string;
    tier: 'authorized' | 'verified_independent' | 'community';
    rating: number;
    completedJobsCount: number;
    location: string;
    distanceKm: number;
  };
  estimatedCostINR: number;
  agreedCostINR: number;
  warrantyMonths: number;
  createdAt: string;
  estimatedCompletion: string;
  timeline: Array<{
    stage: string;
    label: string;
    timestamp?: string;
    note?: string;
    completed: boolean;
    current: boolean;
  }>;
  partsUsed: Array<{
    partName: string;
    partNumber: string;
    grade: 'OEM Genuine' | 'OES Certified' | 'High-grade Replacement';
    costINR: number;
  }>;
}

export interface RepairPassportEntry {
  id: string;
  deviceId: string;
  date: string;
  serviceType: string;
  serviceProvider: string;
  providerTier: 'authorized' | 'verified_independent';
  costINR: number;
  partsReplaced: string[];
  serviceReference: string;
  diagnosticOutcome: string;
  conditionAfterService: DeviceCondition;
}

export interface RecentActivity {
  id: string;
  type: 'diagnostic_run' | 'job_status_updated' | 'passport_stamped' | 'device_registered' | 'quote_received';
  timestamp: string;
  title: string;
  description: string;
  deviceId?: string;
  jobId?: string;
}
