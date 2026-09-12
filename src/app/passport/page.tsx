'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  devicesApi,
  repairJobsApi,
  ApiDevice,
  ApiDeviceDetail,
  ApiRepairJob,
  RecommendedAction,
} from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Download,
  Wrench,
  ChevronDown,
  Clock,
  Star,
  ExternalLink,
  Laptop,
  Smartphone,
  Headphones,
  Tv,
  Tablet,
  CheckCircle2,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  source: 'SYSTEM ASSESSMENT' | 'WORKSHOP RECORD' | 'CUSTOMER REVIEW';
  title: string;
  description: string;
  status?: string;
  cost?: {
    quoted?: number;
    final?: number;
  };
  specialist?: {
    name: string;
    verified: boolean;
    rating?: number;
  };
  partsReplaced?: string[];
  review?: {
    rating: number;
    comment: string;
  };
  details?: {
    verdict?: RecommendedAction;
    likelyIssue?: string;
    confidence?: number;
    repairabilityScore?: number;
    economicScore?: number;
    estimatedCostMin?: number;
    estimatedCostMax?: number;
  };
}

function PassportContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlDeviceId = searchParams.get('deviceId');

  // Device list and selected device
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<ApiDeviceDetail | null>(null);
  const [deviceJobs, setDeviceJobs] = useState<ApiRepairJob[]>([]);

  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch user's registered devices
  const loadDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    setError(null);
    try {
      const data = await devicesApi.list();
      const list = Array.isArray(data) ? data : [];
      setDevices(list);

      // Determine initial selection
      if (list.length > 0) {
        if (urlDeviceId && list.some((d) => d.id === urlDeviceId)) {
          setSelectedDeviceId(urlDeviceId);
        } else {
          setSelectedDeviceId(list[0].id);
        }
      } else {
        setSelectedDeviceId(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load device catalog.');
    } finally {
      setIsLoadingDevices(false);
    }
  }, [urlDeviceId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices, user]);

  // 2. Fetch selected device's complete records (device detail + repair jobs)
  const loadSelectedDeviceRecords = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    setError(null);
    try {
      const [detailData, jobsData] = await Promise.all([
        devicesApi.getById(id),
        repairJobsApi.list().catch(() => [] as ApiRepairJob[]),
      ]);

      setDeviceDetail(detailData);
      // Filter jobs specifically for this device
      const relevantJobs = (Array.isArray(jobsData) ? jobsData : []).filter(
        (job) => job.repairRequest?.device?.id === id
      );
      setDeviceJobs(relevantJobs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load device passport records.');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      loadSelectedDeviceRecords(selectedDeviceId);
    } else {
      setDeviceDetail(null);
      setDeviceJobs([]);
    }
  }, [selectedDeviceId, loadSelectedDeviceRecords]);

  // Extract latest persisted diagnosis & recommendation
  const latestRequestWithDiag = useMemo(() => {
    if (!deviceDetail?.repairRequests) return null;
    return deviceDetail.repairRequests.find((r) => r.recommendation || r.diagnosis) || null;
  }, [deviceDetail]);

  const persistedRecommendation = latestRequestWithDiag?.recommendation;
  const persistedDiagnosis = latestRequestWithDiag?.diagnosis;

  // Active repair job on this device
  const activeRepairJob = useMemo(() => {
    return deviceJobs.find((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED') || null;
  }, [deviceJobs]);

  // Completed repairs
  const completedJobs = useMemo(() => {
    return deviceJobs.filter((j) => j.status === 'COMPLETED');
  }, [deviceJobs]);

  // Cumulative repair spend calculation (only actual persisted numbers)
  const cumulativeCost = useMemo(() => {
    let total = 0;
    let count = 0;

    const seenJobIds = new Set<string>();

    // From completed jobs
    for (const job of completedJobs) {
      const cost = job.actualCost ?? job.agreedCost;
      if (cost != null && cost > 0) {
        total += cost;
        count++;
        seenJobIds.add(job.id);
      }
    }

    // From historical records not linked to listed jobs
    if (deviceDetail?.repairHistory) {
      for (const hist of deviceDetail.repairHistory) {
        if (!seenJobIds.has(hist.repairJobId) && hist.cost > 0) {
          total += hist.cost;
          count++;
        }
      }
    }

    return { total, count };
  }, [completedJobs, deviceDetail]);

  // Construct unified chronological timeline
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!deviceDetail) return [];

    const events: TimelineEvent[] = [];

    // 1. System Assessments (Diagnosis / Recommendation)
    if (deviceDetail.repairRequests) {
      for (const req of deviceDetail.repairRequests) {
        if (req.recommendation || req.diagnosis) {
          const rec = req.recommendation;
          const diag = req.diagnosis;
          events.push({
            id: `diag-${req.id}`,
            date: rec?.createdAt || diag?.createdAt || req.createdAt,
            source: 'SYSTEM ASSESSMENT',
            title: `Diagnostic Triage — ${rec?.recommendedAction ? `Verdict: ${rec.recommendedAction}` : 'Evaluated'}`,
            description: rec?.reasoning || diag?.possibleIssue || req.description,
            details: {
              verdict: rec?.recommendedAction,
              likelyIssue: diag?.possibleIssue,
              confidence: diag?.confidence,
              repairabilityScore: rec?.repairabilityScore,
              economicScore: rec?.economicScore,
              estimatedCostMin: rec?.estimatedCostMin,
              estimatedCostMax: rec?.estimatedCostMax,
            },
          });
        }
      }
    }

    // 2. Workshop Records (Repair Jobs)
    for (const job of deviceJobs) {
      const isCompleted = job.status === 'COMPLETED';
      const isCancelled = job.status === 'CANCELLED';

      events.push({
        id: `job-${job.id}`,
        date: isCompleted && job.completedAt ? job.completedAt : job.startedAt || job.createdAt,
        source: 'WORKSHOP RECORD',
        title: isCompleted
          ? 'Repair Completed & Bench-Verified'
          : isCancelled
          ? 'Repair Cancelled'
          : `Active Workshop Servicing — ${job.status}`,
        description:
          job.notes || job.repairRequest?.description || 'Hardware servicing and inspection performed.',
        status: job.status,
        cost: {
          quoted: job.agreedCost,
          final: job.actualCost ?? undefined,
        },
        specialist: {
          name: job.repairer.businessName,
          verified: job.repairer.verificationStatus === 'VERIFIED',
          rating: job.repairer.rating,
        },
        review: job.review
          ? {
              rating: job.review.rating,
              comment: job.review.comment,
            }
          : undefined,
      });

      // 3. Customer Review as separate evidence event if present
      if (job.review) {
        events.push({
          id: `review-${job.review.id}`,
          date: job.review.createdAt,
          source: 'CUSTOMER REVIEW',
          title: `Verified Customer Review (${job.review.rating} / 5 Stars)`,
          description: `"${job.review.comment}"`,
          specialist: {
            name: job.repairer.businessName,
            verified: job.repairer.verificationStatus === 'VERIFIED',
            rating: job.repairer.rating,
          },
          review: {
            rating: job.review.rating,
            comment: job.review.comment,
          },
        });
      }
    }

    // 4. Any historical records from deviceDetail not already represented by jobs
    if (deviceDetail.repairHistory) {
      const existingJobIds = new Set(deviceJobs.map((j) => j.id));
      for (const hist of deviceDetail.repairHistory) {
        if (!existingJobIds.has(hist.repairJobId)) {
          events.push({
            id: `hist-${hist.id}`,
            date: hist.repairDate,
            source: 'WORKSHOP RECORD',
            title: `Repair Completed — ${hist.repairType}`,
            description: hist.issue + (hist.notes ? ` — ${hist.notes}` : ''),
            status: 'COMPLETED',
            cost: {
              final: hist.cost,
            },
            specialist: hist.repairer
              ? {
                  name: hist.repairer.businessName,
                  verified: hist.repairer.verificationStatus === 'VERIFIED',
                }
              : undefined,
            partsReplaced: hist.partsReplaced,
          });
        }
      }
    }

    // Sort descending by date
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [deviceDetail, deviceJobs]);

  // Export JSON Ledger for this device
  const handleExportLedger = () => {
    if (!deviceDetail) return;
    const ledgerData = {
      exportedAt: new Date().toISOString(),
      platform: 'RepairGraph Digital Hardware Provenance Ledger',
      device: {
        id: deviceDetail.id,
        brand: deviceDetail.brand,
        model: deviceDetail.model,
        category: deviceDetail.category,
        serialNumber: deviceDetail.serialNumber,
        purchaseDate: deviceDetail.purchaseDate,
        purchasePrice: deviceDetail.purchasePrice,
        warrantyExpiry: deviceDetail.warrantyExpiry,
        currentValue: deviceDetail.currentValue,
        condition: deviceDetail.condition,
      },
      currentAssessment: persistedRecommendation
        ? {
            recommendedAction: persistedRecommendation.recommendedAction,
            repairabilityScore: persistedRecommendation.repairabilityScore,
            economicScore: persistedRecommendation.economicScore,
            estimatedCostMin: persistedRecommendation.estimatedCostMin,
            estimatedCostMax: persistedRecommendation.estimatedCostMax,
            reasoning: persistedRecommendation.reasoning,
            assessedAt: persistedRecommendation.createdAt,
          }
        : null,
      cumulativeRepairSpend: cumulativeCost.total,
      completedRepairsCount: cumulativeCost.count,
      timelineEvents,
    };

    const jsonStr = JSON.stringify(ledgerData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repairgraph-passport-${deviceDetail.brand.toLowerCase()}-${deviceDetail.model.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP':
        return <Laptop className="w-4 h-4" />;
      case 'SMARTPHONE':
        return <Smartphone className="w-4 h-4" />;
      case 'TABLET':
        return <Tablet className="w-4 h-4" />;
      case 'MONITOR':
        return <Tv className="w-4 h-4" />;
      case 'HEADPHONES':
        return <Headphones className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return <Badge variant="success">Condition: Excellent</Badge>;
      case 'GOOD':
        return <Badge variant="neutral">Condition: Good</Badge>;
      case 'FAIR':
        return <Badge variant="warning">Condition: Fair</Badge>;
      case 'DEGRADED':
      case 'CRITICAL':
        return <Badge variant="error">Condition: Degraded</Badge>;
      default:
        return <Badge variant="neutral">{condition}</Badge>;
    }
  };

  const isWarrantyActive = (warrantyExpiry?: string | null) => {
    if (!warrantyExpiry) return false;
    return new Date(warrantyExpiry).getTime() > Date.now();
  };

  // 1. Global Loading State
  if (isLoadingDevices) {
    return (
      <div className="py-24 text-center font-mono text-xs text-stone-400 space-y-2">
        <div className="animate-pulse">LOADING DIGITAL HARDWARE PASSPORT REGISTRY…</div>
      </div>
    );
  }

  // 2. Global Error State
  if (error && !deviceDetail) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-800 space-y-3 max-w-xl mx-auto my-12">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Failed to load passport ledger</span>
        </div>
        <p className="text-red-700">{error}</p>
        <Button variant="secondary" onClick={() => loadDevices()}>
          Retry Query
        </Button>
      </div>
    );
  }

  // 3. Zero Devices Registered Empty State
  if (devices.length === 0) {
    return (
      <div className="space-y-10">
        <PageHeader
          title="Device Passport"
          subtitle="Standardized digital maintenance ledger and provenance history for physical hardware."
          breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Device Passport' }]}
        />

        <div className="p-12 text-center border border-dashed border-stone-200 rounded-[2px] space-y-4 max-w-md mx-auto">
          <ShieldCheck className="w-10 h-10 text-stone-400 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">NO DEVICES REGISTERED</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              You have not registered any hardware in your RepairGraph account yet. Register your device
              in the registry to maintain its digital passport, diagnostic record, and maintenance ledger.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/devices">
              <Button variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Register Hardware in Devices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Device Passport"
        subtitle="Standardized hardware provenance ledger and technical service history. Documenting authentic diagnostics, verified workshop repairs, and provenance to protect owner confidence and second-hand value."
        breadcrumbs={[{ label: 'Overview', href: '/' }, { label: 'Device Passport' }]}
        actions={
          <div className="flex items-center gap-2">
            {deviceDetail && (
              <Link href={`/devices/${deviceDetail.id}`}>
                <Button variant="secondary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Return to Device Record
                </Button>
              </Link>
            )}
            <Button
              variant="secondary"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportLedger}
              disabled={!deviceDetail || timelineEvents.length === 0}
            >
              Export Service Ledger
            </Button>
          </div>
        }
      />

      {/* Device Selector Strip */}
      <section className="p-4 bg-stone-50 border border-stone-200 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label htmlFor="passport-device-select" className="text-[10px] font-mono uppercase text-stone-500 font-semibold block">
            Target Hardware Unit
          </label>
          <div className="text-xs text-stone-600">
            Select a device from your registry to view its dedicated provenance ledger.
          </div>
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm">
          <select
            id="passport-device-select"
            value={selectedDeviceId || ''}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full min-h-[44px] bg-white border border-stone-300 rounded-[2px] py-2.5 pl-3 pr-8 text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-500 appearance-none shadow-xs"
          >
            {devices.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.brand} {dev.model} (SN: {dev.serialNumber})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </section>

      {/* Detail Loading Skeleton */}
      {isLoadingDetail && (
        <div className="py-20 text-center font-mono text-xs text-stone-400 space-y-2">
          <div className="animate-pulse">RETRIEVING HARDWARE DOSSIER…</div>
        </div>
      )}

      {/* Selected Device Dossier */}
      {!isLoadingDetail && deviceDetail && (
        <div className="space-y-8">
          {/* 1. Technical Identity Header */}
          <section className="bg-white border border-stone-200 rounded-[2px] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-[2px] bg-stone-100 text-stone-700">
                    {getCategoryIcon(deviceDetail.category)}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                    DEVICE PASSPORT // {deviceDetail.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight break-words">
                  {deviceDetail.brand} {deviceDetail.model}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 font-mono pt-0.5">
                  <span className="break-all">Serial: <strong className="text-stone-800">{deviceDetail.serialNumber}</strong></span>
                  {deviceDetail.purchaseDate && (
                    <>
                      <span>•</span>
                      <span>
                        Purchased:{' '}
                        {new Date(deviceDetail.purchaseDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </>
                  )}
                  {deviceDetail.purchasePrice != null && deviceDetail.purchasePrice > 0 && (
                    <>
                      <span>•</span>
                      <span>Original: ₹{deviceDetail.purchasePrice.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {getConditionBadge(deviceDetail.condition)}
                <Badge
                  variant={isWarrantyActive(deviceDetail.warrantyExpiry) ? 'success' : 'outline'}
                  dot
                >
                  {isWarrantyActive(deviceDetail.warrantyExpiry) ? 'Under Warranty' : 'Warranty Expired'}
                </Badge>
                {activeRepairJob ? (
                  <Badge variant="warning" dot>
                    Active Repair
                  </Badge>
                ) : persistedRecommendation ? (
                  <Badge variant="neutral" dot>
                    Assessed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Not Yet Assessed
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-1">
              <div className="space-y-0.5">
                <span className="text-stone-400 uppercase text-[10px] block">Fair Market Value</span>
                <span className="text-base font-bold text-stone-900 tabular-nums">
                  {deviceDetail.currentValue != null && deviceDetail.currentValue > 0
                    ? `₹${deviceDetail.currentValue.toLocaleString('en-IN')}`
                    : 'Not calculated'}
                </span>
              </div>

              <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
                <span className="text-stone-400 uppercase text-[10px] block">Recorded Repair Spend</span>
                <span className="text-base font-bold text-stone-900 tabular-nums">
                  {cumulativeCost.total > 0
                    ? `₹${cumulativeCost.total.toLocaleString('en-IN')}`
                    : '₹0'}
                </span>
                <span className="text-[10px] text-stone-400 block">
                  across {cumulativeCost.count} {cumulativeCost.count === 1 ? 'completed repair' : 'completed repairs'}
                </span>
              </div>

              <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
                <span className="text-stone-400 uppercase text-[10px] block">Service Events Logged</span>
                <span className="text-base font-bold text-stone-900 tabular-nums">
                  {timelineEvents.length}
                </span>
                <span className="text-[10px] text-stone-400 block">total ledger entries</span>
              </div>

              <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
                <span className="text-stone-400 uppercase text-[10px] block">Last Known State</span>
                <span className="text-xs font-bold text-stone-900 block truncate">
                  {activeRepairJob
                    ? `In Workshop (${activeRepairJob.status})`
                    : persistedRecommendation
                    ? `Recommended: ${persistedRecommendation.recommendedAction}`
                    : 'Operational Baseline'}
                </span>
              </div>
            </div>
          </section>

          {/* 2. Current Diagnostic Assessment */}
          <section className="bg-white border border-stone-200 rounded-[2px] p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                Current Technical Assessment
              </h3>
              {persistedRecommendation && (
                <span className="text-[11px] font-mono text-stone-400">
                  Assessed on{' '}
                  {new Date(persistedRecommendation.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            {persistedRecommendation ? (
              <div className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 border border-stone-200 rounded-[2px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-stone-500">
                        RepairGraph Recommendation:
                      </span>
                      <Badge
                        variant={
                          persistedRecommendation.recommendedAction === 'REPAIR'
                            ? 'success'
                            : persistedRecommendation.recommendedAction === 'DIY'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {persistedRecommendation.recommendedAction}
                      </Badge>
                    </div>
                    <p className="text-stone-700 leading-relaxed max-w-2xl text-xs">
                      {persistedRecommendation.reasoning}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-stone-400 font-mono text-[10px] uppercase block">
                      Estimated Repair Range
                    </span>
                    <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                      ₹{persistedRecommendation.estimatedCostMin.toLocaleString('en-IN')} – ₹
                      {persistedRecommendation.estimatedCostMax.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 border border-stone-200 rounded-[2px]">
                    <span className="text-stone-400 text-[10px] uppercase block mb-1">
                      Repairability Score
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {persistedRecommendation.repairabilityScore} / 100
                    </span>
                  </div>

                  <div className="p-3 border border-stone-200 rounded-[2px]">
                    <span className="text-stone-400 text-[10px] uppercase block mb-1">
                      Economic Value Score
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {persistedRecommendation.economicScore} / 100
                    </span>
                  </div>

                  <div className="p-3 border border-stone-200 rounded-[2px] col-span-2 sm:col-span-1">
                    <span className="text-stone-400 text-[10px] uppercase block mb-1">
                      Likely Symptom Source
                    </span>
                    <span className="text-xs font-semibold text-stone-800 truncate block">
                      {persistedDiagnosis?.possibleIssue || 'Evaluated Hardware Defect'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-stone-200 rounded-[2px] space-y-3">
                <AlertCircle className="w-6 h-6 text-stone-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight">
                    NO ASSESSMENT RECORDED
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    This device has not been evaluated by RepairGraph yet. Run a structured symptom triage
                    to evaluate technical repairability and economic feasibility.
                  </p>
                </div>
                <div className="pt-1">
                  <Link href={`/report?deviceId=${deviceDetail.id}`}>
                    <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
                      Report a Problem / Diagnose
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 3. Chronological Service & Evidence Timeline */}
          <section className="bg-white border border-stone-200 rounded-[2px] p-5 sm:p-6 space-y-6">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                  Technical Service & Provenance Ledger
                </h3>
                <span className="text-xs text-stone-500">
                  Chronological records of diagnostic evaluations, workshop servicing, and verified customer feedback.
                </span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                {timelineEvents.length} {timelineEvents.length === 1 ? 'RECORD' : 'RECORDS'}
              </span>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-stone-200 rounded-[2px] space-y-2 max-w-lg mx-auto">
                <ShieldCheck className="w-8 h-8 text-stone-400 mx-auto" />
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-tight">
                  NO REPAIR HISTORY
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  No completed repair events are recorded for this device. That does not mean the device
                  has never been repaired elsewhere.
                </p>
                <div className="pt-2">
                  <Link href={`/report?deviceId=${deviceDetail.id}`}>
                    <Button variant="secondary" icon={<Wrench className="w-3.5 h-3.5" />}>
                      Report a Symptom
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l border-stone-200 space-y-8 my-2">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        event.source === 'WORKSHOP RECORD'
                          ? 'bg-orange-800 ring-2 ring-orange-100'
                          : event.source === 'SYSTEM ASSESSMENT'
                          ? 'bg-stone-800 ring-2 ring-stone-100'
                          : 'bg-emerald-600 ring-2 ring-emerald-100'
                      }`}
                    />

                    <div className="space-y-2 bg-stone-50/50 hover:bg-stone-50 p-4 border border-stone-200 rounded-[2px] transition-colors">
                      {/* Header Row: Date & Source Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] font-bold tracking-wider ${
                              event.source === 'WORKSHOP RECORD'
                                ? 'bg-orange-100 text-orange-900'
                                : event.source === 'SYSTEM ASSESSMENT'
                                ? 'bg-stone-200 text-stone-800'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {event.source}
                          </span>
                          <span className="text-stone-300 font-mono">•</span>
                          <span className="font-mono text-xs text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {new Date(event.date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {event.status && (
                          <Badge
                            variant={
                              event.status === 'COMPLETED'
                                ? 'success'
                                : event.status === 'CANCELLED'
                                ? 'neutral'
                                : 'warning'
                            }
                          >
                            {event.status}
                          </Badge>
                        )}
                      </div>

                      {/* Event Title */}
                      <h4 className="text-sm font-bold text-stone-900 tracking-tight break-words">
                        {event.title}
                      </h4>

                      {/* Event Description */}
                      <p className="text-xs text-stone-700 leading-relaxed break-words">
                        {event.description}
                      </p>

                      {/* Workshop Record Specifics: Specialist & Cost */}
                      {event.source === 'WORKSHOP RECORD' && (
                        <div className="pt-2 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                          {event.specialist && (
                            <div className="min-w-0">
                              <span className="text-stone-400 text-[10px] uppercase block">
                                Servicing Entity
                              </span>
                              <span className="font-semibold text-stone-900 break-words">
                                {event.specialist.name}
                              </span>
                              {event.specialist.verified && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 ml-1.5">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </div>
                          )}

                          {event.cost && (
                            <div>
                              <span className="text-stone-400 text-[10px] uppercase block">
                                Invoiced Amount
                              </span>
                              <div className="flex items-baseline gap-2">
                                {event.cost.final != null ? (
                                  <>
                                    <span className="font-bold text-stone-900 text-sm">
                                      ₹{event.cost.final.toLocaleString('en-IN')}
                                    </span>
                                    {event.cost.quoted != null && event.cost.quoted !== event.cost.final && (
                                      <span className="text-[10px] text-stone-400 line-through">
                                        Quoted: ₹{event.cost.quoted.toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </>
                                ) : event.cost.quoted != null ? (
                                  <span className="text-stone-800">
                                    Quoted: ₹{event.cost.quoted.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-stone-400">Not recorded</span>
                                )}
                              </div>
                            </div>
                          )}

                          {event.partsReplaced && event.partsReplaced.length > 0 && (
                            <div className="col-span-full pt-1">
                              <span className="text-stone-400 text-[10px] uppercase block">
                                Components Replaced
                              </span>
                              <span className="text-stone-700 text-xs font-sans">
                                {event.partsReplaced.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Customer Review Specifics */}
                      {event.review && event.source === 'CUSTOMER REVIEW' && (
                        <div className="pt-2 border-t border-stone-200/80 flex items-center gap-2 text-xs">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= event.review!.rating
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-stone-500 text-[11px]">
                            Verified Customer Feedback
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Action Bridge: What Should Happen Next */}
          <section className="bg-stone-50 border border-stone-200 rounded-[2px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-stone-500 font-bold block">
                Next Operational Step
              </span>
              <p className="text-xs text-stone-700 max-w-xl">
                {activeRepairJob ? (
                  <>
                    An active repair job is in progress with <strong>{activeRepairJob.repairer.businessName}</strong>.
                    Track workshop milestones and inspection updates in the Repairs workspace.
                  </>
                ) : persistedRecommendation?.recommendedAction === 'REPAIR' ? (
                  <>
                    RepairGraph recommends professional repair for this device. Compare quotes from verified
                    workshops in the marketplace.
                  </>
                ) : !persistedRecommendation ? (
                  <>
                    No active diagnosis on file. If this device is experiencing hardware malfunctions, submit a
                    symptom report to generate an assessment.
                  </>
                ) : (
                  <>
                    Hardware provenance ledger is up to date. You can export the service ledger for resale
                    verification or warranty compliance.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeRepairJob ? (
                <Link href="/repairs">
                  <Button variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View Active Repair
                  </Button>
                </Link>
              ) : persistedRecommendation?.recommendedAction === 'REPAIR' ? (
                <Link href="/repairers">
                  <Button variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Find a Specialist
                  </Button>
                </Link>
              ) : !persistedRecommendation ? (
                <Link href={`/report?deviceId=${deviceDetail.id}`}>
                  <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
                    Report a Problem
                  </Button>
                </Link>
              ) : (
                <Link href={`/devices/${deviceDetail.id}`}>
                  <Button variant="secondary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Manage Hardware
                  </Button>
                </Link>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center font-mono text-xs text-stone-400">
          INITIALIZING REPAIR PASSPORT LEDGER…
        </div>
      }
    >
      <PassportContent />
    </Suspense>
  );
}
