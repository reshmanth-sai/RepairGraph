export type UserRole = 'USER' | 'REPAIRER' | 'ADMIN';
export type DeviceCategory = 'SMARTPHONE' | 'LAPTOP' | 'TABLET' | 'HEADPHONES' | 'MONITOR';
export type DeviceCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DEGRADED' | 'CRITICAL';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RequestStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DIAGNOSING'
  | 'WAITING_FOR_PART'
  | 'REPAIRING'
  | 'TESTING'
  | 'COMPLETED'
  | 'CANCELLED';
export type RecommendedAction = 'REPAIR' | 'DIY' | 'REPLACE' | 'RESELL' | 'RECYCLE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type JobStatus =
  | 'ACCEPTED'
  | 'DIAGNOSING'
  | 'WAITING_FOR_PART'
  | 'REPAIRING'
  | 'TESTING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  createdAt: string;
}

export interface ApiDevice {
  id: string;
  userId: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  warrantyExpiry?: string | null;
  currentValue?: number | null;
  condition: DeviceCondition;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  repairRequests?: Array<{
    id: string;
    status: RequestStatus;
    description: string;
    createdAt: string;
  }>;
}

export interface ApiDeviceDetail extends ApiDevice {
  repairRequests: Array<ApiRepairRequest>;
  repairHistory: Array<ApiRepairHistory>;
}

export interface ApiDiagnosis {
  id: string;
  repairRequestId: string;
  issueCategory: string;
  possibleIssue: string;
  confidence: number;
  evidence: string[];
  createdAt: string;
}

export interface ApiRepairRecommendation {
  id: string;
  repairRequestId: string;
  repairabilityScore: number;
  economicScore: number;
  recommendedAction: RecommendedAction;
  estimatedCostMin: number;
  estimatedCostMax: number;
  reasoning: string;
  createdAt: string;
}

export interface ApiRepairer {
  id: string;
  userId: string;
  businessName: string;
  description?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  verificationStatus: VerificationStatus;
  rating: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
  specializations?: Array<{
    id: string;
    repairerId: string;
    deviceCategory: DeviceCategory;
    brand: string;
    serviceType: string;
  }>;
  _count?: {
    reviews: number;
    repairJobs?: number;
  };
  reviews?: ApiReview[];
}

export interface ApiQuote {
  id: string;
  repairRequestId: string;
  repairerId: string;
  estimatedCost: number;
  estimatedDays: number;
  notes?: string | null;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  repairer: {
    id: string;
    businessName: string;
    rating: number;
    totalJobs: number;
    address: string;
    verificationStatus: VerificationStatus;
  };
}

export interface ApiRepairJob {
  id: string;
  repairRequestId: string;
  repairerId: string;
  quoteId: string;
  status: JobStatus;
  agreedCost: number;
  actualCost?: number | null;
  startedAt: string;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  repairRequest?: {
    id: string;
    description: string;
    device: {
      id: string;
      brand: string;
      model: string;
      category: DeviceCategory;
      serialNumber: string;
    };
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  };
  repairer: {
    id: string;
    businessName: string;
    rating: number;
    totalJobs: number;
    address: string;
    verificationStatus: VerificationStatus;
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  };
  quote?: ApiQuote;
  repairHistory?: ApiRepairHistory | null;
  review?: ApiReview | null;
}

export interface ApiRepairRequest {
  id: string;
  deviceId: string;
  userId: string;
  description: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  device?: {
    id: string;
    brand: string;
    model: string;
    category: DeviceCategory;
    serialNumber: string;
  };
  diagnosis?: ApiDiagnosis | null;
  recommendation?: ApiRepairRecommendation | null;
  quotes?: ApiQuote[];
  repairJob?: ApiRepairJob | null;
  _count?: {
    quotes: number;
  };
}

export interface ApiRepairHistory {
  id: string;
  deviceId: string;
  repairJobId: string;
  repairType: string;
  issue: string;
  partsReplaced: string[];
  cost: number;
  repairerId: string;
  repairDate: string;
  notes?: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  device?: {
    id: string;
    brand: string;
    model: string;
    serialNumber: string;
    category?: DeviceCategory;
  };
  repairer?: {
    id: string;
    businessName: string;
    rating: number;
    verificationStatus: VerificationStatus;
  };
  repairJob?: {
    id: string;
    status: JobStatus;
    agreedCost: number;
    actualCost?: number | null;
  };
}

export interface ApiReview {
  id: string;
  repairJobId: string;
  userId: string;
  repairerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
}
