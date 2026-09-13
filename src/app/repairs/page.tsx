'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  repairRequestsApi,
  quotesApi,
  repairJobsApi,
  reviewsApi,
  ApiRepairRequest,
  ApiQuote,
  JobStatus
} from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { sanitizeErrorMessage } from '@/lib/sanitizeError';
import { Timeline, TimelineStep } from '@/components/ui/Timeline';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QuoteComparison } from '@/components/marketplace/QuoteComparison';
import {
  Wrench,
  MapPin,
  AlertCircle,
  Star,
  Cpu,
  RefreshCw,
} from 'lucide-react';

const getJobStatusExplanation = (status: JobStatus) => {
  switch (status) {
    case 'ACCEPTED':
      return {
        stageName: 'Quote Accepted',
        desc: 'The specialist has accepted the repair assignment. Intake diagnostics will begin when the hardware reaches the workshop bench.',
      };
    case 'DIAGNOSING':
      return {
        stageName: 'Component Diagnostics',
        desc: 'The specialist is assessing internal hardware, circuits, and components to verify reported failure symptoms.',
      };
    case 'WAITING_FOR_PART':
      return {
        stageName: 'Parts Procurement',
        desc: 'The repair is paused while OEM-grade or verified replacement components are sourced by the workshop.',
      };
    case 'REPAIRING':
      return {
        stageName: 'Hardware Servicing',
        desc: "Active repair, micro-soldering, and component installation are underway on the technician's bench.",
      };
    case 'TESTING':
      return {
        stageName: 'Bench Stress Validation',
        desc: 'The device is undergoing diagnostic stress tests, thermal loops, and functional checks before handover.',
      };
    case 'COMPLETED':
      return {
        stageName: 'Handover & Passport Stamped',
        desc: 'Hardware service has passed quality verification. Handover is complete and a permanent record has been stamped to your Repair Passport.',
      };
    case 'CANCELLED':
      return {
        stageName: 'Repair Terminated',
        desc: 'This repair job was cancelled. No active workshop servicing is underway.',
      };
  }
};

export default function RepairsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApiRepairRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApiRepairRequest | null>(null);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Technician Quote Form State
  const [quoteCost, setQuoteCost] = useState('');
  const [quoteDays, setQuoteDays] = useState('2');
  const [quoteNotes, setQuoteNotes] = useState('');

  const handleReevaluate = async () => {
    if (!selectedRequestId) return;
    setIsDiagnosing(true);
    try {
      const updated = await repairRequestsApi.diagnose(selectedRequestId);
      setSelectedRequest(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to re-evaluate diagnostics.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repairRequestsApi.list();
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      if (list.length > 0) {
        setSelectedRequestId((prev) => (prev && list.some((r) => r.id === prev) ? prev : list[0].id));
      } else {
        setSelectedRequestId(null);
        setSelectedRequest(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load repair requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRequestDetail = useCallback(async (id: string) => {
    try {
      const detail = await repairRequestsApi.getById(id);
      setSelectedRequest(detail);
      // Load quotes if requested
      if (detail.status === 'REQUESTED') {
        const quotesData = await repairRequestsApi.listQuotes(id);
        setQuotes(Array.isArray(quotesData) ? quotesData : []);
      } else {
        setQuotes(detail.quotes || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch request detail.');
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, user]);

  useEffect(() => {
    if (selectedRequestId) {
      loadRequestDetail(selectedRequestId);
    }
  }, [selectedRequestId, loadRequestDetail]);

  // Customer accepts a quote
  const handleAcceptQuote = async (quote: ApiQuote) => {
    setIsActionLoading(true);
    try {
      await quotesApi.updateStatus(quote.id, { status: 'ACCEPTED' });
      if (selectedRequestId) {
        await loadRequestDetail(selectedRequestId);
        await loadRequests();
      }
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to accept quote.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Customer declines a quote
  const handleDeclineQuote = async (quote: ApiQuote) => {
    setIsActionLoading(true);
    try {
      await quotesApi.updateStatus(quote.id, { status: 'REJECTED' });
      if (selectedRequestId) {
        await loadRequestDetail(selectedRequestId);
      }
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to decline quote.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Technician advances job status
  const handleAdvanceJobStatus = async (jobId: string, nextStatus: JobStatus, actualCost?: number) => {
    setIsActionLoading(true);
    try {
      await repairJobsApi.updateStatus(jobId, {
        status: nextStatus,
        actualCost,
      });
      if (selectedRequestId) {
        await loadRequestDetail(selectedRequestId);
        await loadRequests();
      }
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to update job status.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Customer submits review for completed job
  const handleReviewSubmit = async (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await reviewsApi.create({
        repairJobId: jobId,
        rating,
        comment: reviewComment.trim(),
      });
      setReviewSubmitted(true);
      if (selectedRequestId) {
        await loadRequestDetail(selectedRequestId);
      }
    } catch (err: unknown) {
      alert(sanitizeErrorMessage(err, 'Failed to submit review.'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Technician submits a quote for an open request
  const handleTechnicianSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) return;
    setIsActionLoading(true);
    try {
      await repairRequestsApi.submitQuote(selectedRequestId, {
        estimatedCost: parseFloat(quoteCost),
        estimatedDays: parseInt(quoteDays, 10),
        notes: quoteNotes.trim() || undefined,
      });
      setQuoteCost('');
      setQuoteNotes('');
      await loadRequestDetail(selectedRequestId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit quote.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Helper to build timeline steps
  const buildTimelineSteps = (jobStatus: JobStatus): TimelineStep[] => {
    const stages: Array<{ id: JobStatus; label: string; note: string }> = [
      { id: 'ACCEPTED', label: 'Quote Accepted & Dispatched', note: 'Customer accepted specialist quote' },
      { id: 'DIAGNOSING', label: 'Component Diagnostics', note: 'Oscilloscope & thermal intake inspection' },
      { id: 'WAITING_FOR_PART', label: 'Parts Procurement', note: 'OEM components in transit to bench' },
      { id: 'REPAIRING', label: 'Hardware Servicing', note: 'Component installation & micro-soldering' },
      { id: 'TESTING', label: 'Bench Stress Validation', note: 'Thermal loop & load testing' },
      { id: 'COMPLETED', label: 'Handover & Passport Stamped', note: 'Final inspection passed; warranty active' },
    ];

    const stageOrder: JobStatus[] = ['ACCEPTED', 'DIAGNOSING', 'WAITING_FOR_PART', 'REPAIRING', 'TESTING', 'COMPLETED'];
    const currentIdx = stageOrder.indexOf(jobStatus);

    return stages.map((stage, idx) => {
      const isCompleted = idx < currentIdx || jobStatus === 'COMPLETED';
      const isCurrent = idx === currentIdx && jobStatus !== 'COMPLETED';
      return {
        stage: stage.id,
        label: stage.label,
        note: stage.note,
        completed: isCompleted,
        current: isCurrent,
      };
    });
  };

  const activeJob = selectedRequest?.repairJob;
  const isTechnician = user?.role === 'REPAIRER';
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'USER' || (!isTechnician && !isAdmin);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Repair Tracking"
        subtitle="Active repair jobs, state-machine telemetry, technician quotes, and verified lifecycle status."
        breadcrumbs={[
          { label: 'Overview', href: '/overview' },
          { label: 'Repairs' }
        ]}
        actions={
          <Link href="/report">
            <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
              New Request
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[2px] flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadRequests()} className="font-semibold underline font-mono">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center font-mono text-xs text-stone-400">
          ACCESSING REPAIR STATE MACHINE TELEMETRY…
        </div>
      )}

      {/* Empty State */}
      {!isLoading && requests.length === 0 && (
        <div className="py-16 text-center space-y-3 border border-dashed border-stone-200 rounded-[2px] p-8 max-w-md mx-auto">
          <div className="w-9 h-9 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-800">No active repair requests</h3>
            <p className="text-xs text-stone-500">
              You do not have any open or historical repair tickets logged in the system.
            </p>
          </div>
          <Link href="/report">
            <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
              Report a Hardware Fault
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content when requests exist */}
      {!isLoading && requests.length > 0 && selectedRequest && (
        <div className="space-y-6">
          {/* Request Selector Tabs */}
          {requests.length > 1 && (
            <div role="tablist" aria-label="Active repair tickets" className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mr-2 shrink-0">
                ACTIVE TICKETS:
              </span>
              {requests.map((r, idx) => {
                const isSelected = r.id === selectedRequestId;
                return (
                  <button
                    key={r.id}
                    id={`ticket-tab-${r.id}`}
                    role="tab"
                    tabIndex={isSelected ? 0 : -1}
                    aria-selected={isSelected}
                    onClick={() => setSelectedRequestId(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = requests[(idx + 1) % requests.length];
                        setSelectedRequestId(next.id);
                        document.getElementById(`ticket-tab-${next.id}`)?.focus();
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = requests[(idx - 1 + requests.length) % requests.length];
                        setSelectedRequestId(prev.id);
                        document.getElementById(`ticket-tab-${prev.id}`)?.focus();
                      }
                    }}
                    className={`min-h-[44px] px-3.5 py-2 text-xs rounded-[2px] font-medium transition-colors shrink-0 flex items-center gap-2 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
                      isSelected
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'
                    }`}
                  >
                    <span>{r.device ? `${r.device.brand} ${r.device.model}` : 'Hardware Unit'}</span>
                    <Badge variant={r.status === 'COMPLETED' ? 'success' : 'neutral'}>
                      {r.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Job Operational Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-orange-800 uppercase tracking-wider bg-orange-50 px-1.5 py-0.5 rounded-[2px] border border-orange-200">
                  REF: {selectedRequest.id}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-[11px] font-mono text-stone-500">
                  Logged {new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-stone-300">•</span>
                <Badge variant={selectedRequest.urgency === 'HIGH' ? 'error' : 'warning'}>
                  {selectedRequest.urgency} Urgency
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                {selectedRequest.device?.brand} {selectedRequest.device?.model}
              </h2>
              <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
                {selectedRequest.description}
              </p>
            </div>

            <div>
              <StatusIndicator
                status={
                  selectedRequest.status === 'COMPLETED'
                    ? 'completed'
                    : selectedRequest.status === 'REQUESTED'
                    ? 'attention'
                    : 'in_progress'
                }
                label={`Status: ${selectedRequest.status}`}
              />
            </div>
          </div>

          {/* Diagnostic Intelligence & Lifecycle Decision Engine */}
          {(selectedRequest.diagnosis || selectedRequest.recommendation) && (
            <div className="border border-stone-200 bg-white rounded-[2px] overflow-hidden shadow-2xs space-y-0">
              {/* Header */}
              <div className="bg-stone-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Repair Assessment & Recommendation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReevaluate}
                  disabled={isDiagnosing}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-stone-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Trigger deterministic re-evaluation"
                >
                  <RefreshCw className={`w-3 h-3 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'Re-evaluating…' : 'Re-run Diagnosis'}</span>
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* 1. VISUALLY DOMINANT RECOMMENDATION STAMP */}
                {selectedRequest.recommendation && (
                  <div className="border border-stone-200 bg-[#FAFAF9] p-4 sm:p-5 rounded-[2px] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200/80 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold block">
                          Primary Recommendation
                        </span>
                        <div className="flex items-center gap-3 pt-1">
                          <Badge
                            variant={
                              selectedRequest.recommendation.recommendedAction === 'DIY'
                                ? 'success'
                                : selectedRequest.recommendation.recommendedAction === 'REPAIR'
                                ? 'rust'
                                : selectedRequest.recommendation.recommendedAction === 'RESELL'
                                ? 'warning'
                                : 'error'
                            }
                            size="md"
                          >
                            {selectedRequest.recommendation.recommendedAction}
                          </Badge>
                          <span className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                            {selectedRequest.recommendation.recommendedAction === 'REPAIR'
                              ? 'Professional Workshop Repair Advised'
                              : selectedRequest.recommendation.recommendedAction === 'DIY'
                              ? 'User Self-Repair Feasible'
                              : selectedRequest.recommendation.recommendedAction === 'RESELL'
                              ? 'Resale / Parts Harvesting Recommended'
                              : selectedRequest.recommendation.recommendedAction === 'RECYCLE'
                              ? 'Certified E-Waste Recycling Advised'
                              : 'Hardware Replacement Recommended'}
                          </span>
                        </div>
                      </div>

                      <div className="font-mono text-xs text-stone-500">
                        Evaluated for {selectedRequest.device?.brand} {selectedRequest.device?.model}
                      </div>
                    </div>

                    {/* Why RepairGraph recommends this */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-stone-600 block">
                        Why RepairGraph Reached This Conclusion
                      </span>
                      <div className="space-y-2 text-stone-700 leading-relaxed text-xs">
                        {selectedRequest.recommendation.reasoning.split('\n\n').map((paragraph, idx) => (
                          <p key={idx} className="border-l-2 border-orange-700/60 pl-3">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. WHAT WE FOUND (OBSERVED HARDWARE SIGNALS & SAFETY WARNINGS) */}
                {selectedRequest.diagnosis && (
                  <div className="space-y-3">
                    <div className="border-b border-stone-200 pb-1.5 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-stone-900 uppercase font-mono tracking-wider">
                        Observed Hardware Signals
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-200">
                        {selectedRequest.diagnosis.confidence}% Confidence
                      </span>
                    </div>

                    {/* Safety Warnings if present */}
                    {selectedRequest.diagnosis.evidence?.some(
                      (ev) =>
                        ev.toLowerCase().includes('warning') ||
                        ev.toLowerCase().includes('liquid') ||
                        ev.toLowerCase().includes('swollen') ||
                        ev.toLowerCase().includes('hazard')
                    ) && (
                      <div className="p-3.5 bg-red-50 border-l-4 border-red-700 border border-red-200 rounded-[2px] space-y-1.5 text-xs text-red-950">
                        <div className="flex items-center gap-2 font-bold text-red-900">
                          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                          <span>Safety Incident Warning</span>
                        </div>
                        <p className="text-[11px] text-red-800 leading-relaxed">
                          Potential safety hazard detected from reported failure symptoms. Exercise caution: avoid charging, unshielded disassembly, or powered operation until verified.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                          Likely Failure Condition
                        </span>
                        <div className="font-bold text-stone-900 text-sm">
                          {selectedRequest.diagnosis.possibleIssue}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500">
                          Component Subsystem: {selectedRequest.diagnosis.issueCategory}
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                          Extracted Symptom Evidence
                        </span>
                        <ul className="space-y-1 text-[11px]">
                          {selectedRequest.diagnosis.evidence.map((ev, i) => {
                            const isWarning =
                              ev.includes('WARNING') || ev.includes('swollen') || ev.includes('liquid');
                            return (
                              <li
                                key={i}
                                className={`flex items-start gap-1.5 p-1 rounded-[2px] ${
                                  isWarning
                                    ? 'bg-red-100/60 text-red-900 font-medium'
                                    : 'text-stone-700'
                                }`}
                              >
                                <span className="font-mono text-stone-400 shrink-0">•</span>
                                <span>{ev}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. WHAT IT WILL COST & ECONOMIC METRICS */}
                {selectedRequest.recommendation && (
                  <div className="space-y-3">
                    <div className="border-b border-stone-200 pb-1.5">
                      <span className="text-xs font-bold text-stone-900 uppercase font-mono tracking-wider">
                        Repair Economics & Feasibility
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-0.5">
                        <span className="font-mono text-stone-500 text-[10px] uppercase block">
                          Est. Repair Cost
                        </span>
                        <div className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                          ₹{selectedRequest.recommendation.estimatedCostMin.toLocaleString('en-IN')} – ₹{selectedRequest.recommendation.estimatedCostMax.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">Benchmark range</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-0.5">
                        <span className="font-mono text-stone-500 text-[10px] uppercase block">
                          Current Device Value
                        </span>
                        <div className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                          {selectedRequest.device && 'currentValue' in selectedRequest.device && selectedRequest.device.currentValue
                            ? `₹${Number(selectedRequest.device.currentValue).toLocaleString('en-IN')}`
                            : 'Nominal value'}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">Residual valuation</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-stone-500 text-[10px] uppercase">
                            Repairability
                          </span>
                          <span className="font-mono font-bold text-stone-900">
                            {selectedRequest.recommendation.repairabilityScore}
                            <span className="text-stone-400 font-normal text-[10px]">/100</span>
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-[1px] overflow-hidden">
                          <div
                            className="bg-orange-700 h-full rounded-[1px]"
                            style={{ width: `${selectedRequest.recommendation.repairabilityScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-stone-500 text-[10px] uppercase">
                            Economic Score
                          </span>
                          <span className="font-mono font-bold text-stone-900">
                            {selectedRequest.recommendation.economicScore}
                            <span className="text-stone-400 font-normal text-[10px]">/100</span>
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-[1px] overflow-hidden">
                          <div
                            className="bg-emerald-700 h-full rounded-[1px]"
                            style={{ width: `${selectedRequest.recommendation.economicScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. RECOMMENDATION -> ACTION BRIDGE */}
                {selectedRequest.recommendation && (
                  <div className="pt-2 border-t border-stone-200">
                    {selectedRequest.recommendation.recommendedAction === 'REPAIR' && (
                      <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-[2px] space-y-3">
                        <div className="space-y-1">
                          <span className="font-bold text-stone-900 text-xs block font-mono uppercase tracking-wider">
                            What You Can Do Next // Certified Workshop Repair
                          </span>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            RepairGraph recommends professional repair. This request is published in the specialist marketplace where certified workshops can review technical symptoms and submit binding repair quotes.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <Link href="/repairers">
                            <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
                              Browse Verified Specialists
                            </Button>
                          </Link>
                          {quotes.length > 0 && (
                            <span className="text-xs font-mono text-emerald-800 font-semibold">
                              ✓ {quotes.length} workshop quote{quotes.length === 1 ? '' : 's'} available below
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedRequest.recommendation.recommendedAction === 'DIY' && (
                      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-[2px] space-y-3">
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-950 text-xs block font-mono uppercase tracking-wider">
                            What You Can Do Next // Self-Service Feasibility
                          </span>
                          <p className="text-xs text-stone-700 leading-relaxed">
                            Based on modular hardware layout and component serviceability, self-repair is relatively feasible. Always adhere to manufacturer hardware manuals, disconnect battery power before servicing, and use electrostatic discharge (ESD) protection.
                          </p>
                          <p className="text-[11px] text-stone-500">
                            <em>Notice: RepairGraph provides diagnostic evaluation and does not author repair guides. Consult official manufacturer documentation.</em>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <Link href="/repairers">
                            <Button variant="secondary" icon={<Wrench className="w-3.5 h-3.5" />}>
                              Prefer a Professional? Find a Specialist
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {selectedRequest.recommendation.recommendedAction === 'RECYCLE' && (
                      <div className="p-4 bg-stone-100/70 border border-stone-300 rounded-[2px] space-y-3">
                        <div className="space-y-1">
                          <span className="font-bold text-stone-900 text-xs block font-mono uppercase tracking-wider">
                            What You Can Do Next // Certified E-Waste Disposal
                          </span>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Continued repair is economically unfavorable or technically hazardous. Under the E-Waste (Management) Rules, 2022, obsolete or dead electronics must be diverted from landfills and handed over to authorized collection centers or registered recyclers.
                          </p>
                          <p className="text-[11px] text-stone-500">
                            <em>Notice: RepairGraph provides lifecycle intelligence and does not operate a direct physical collection or disposal service.</em>
                          </p>
                        </div>
                        <div className="pt-1">
                          <a
                            href="https://ewastemonitor.info/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 hover:text-orange-800 underline underline-offset-2"
                          >
                            Review E-Waste Disposal Guidelines (UNITAR) ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedRequest.recommendation.recommendedAction === 'RESELL' && (
                      <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-[2px] space-y-3">
                        <div className="space-y-1">
                          <span className="font-bold text-stone-900 text-xs block font-mono uppercase tracking-wider">
                            What You Can Do Next // Secondary Market Resale
                          </span>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            The residual fair-market value exceeds repair utility. Reselling the device as-is or for parts provides the optimal financial return. Remember to perform a cryptographic factory wipe and disconnect cloud accounts before handover.
                          </p>
                          <p className="text-[11px] text-stone-500">
                            <em>Notice: RepairGraph does not conduct secondary hardware transactions or act as a marketplace broker.</em>
                          </p>
                        </div>
                        <div className="pt-1">
                          <Link href={`/devices/${selectedRequest.deviceId}`}>
                            <Button variant="secondary">
                              Inspect Device Record
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {selectedRequest.recommendation.recommendedAction === 'REPLACE' && (
                      <div className="p-4 bg-stone-100/80 border border-stone-200 rounded-[2px] space-y-3">
                        <div className="space-y-1">
                          <span className="font-bold text-stone-900 text-xs block font-mono uppercase tracking-wider">
                            What You Can Do Next // Hardware Replacement Planning
                          </span>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            The estimated repair expenditure exceeds the residual fair-market valuation of this hardware unit. Continued repair represents negative economic value. Verify your personal data backup and consider retiring this device.
                          </p>
                        </div>
                        <div className="pt-1">
                          <Link href="/devices">
                            <Button variant="secondary">
                              Return to Hardware Registry
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PHASE A: Open Request awaiting quotes */}
          {selectedRequest.status === 'REQUESTED' && (
            <div className="space-y-6 pt-2">
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-[2px] flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Awaiting Specialist Quotes</span>
                  <span>
                    This ticket is open in the repairer registry. Certified workshops can submit quotes based on the reported symptoms.
                  </span>
                </div>
              </div>

              {/* Quotes received section */}
              <div className="space-y-3">
                <div className="border-b border-stone-200 pb-2 flex items-baseline justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                      Quotes Received ({quotes.length})
                    </h3>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Competitive bids from verified workshops. Commercial choice to initiate repair.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    MARKETPLACE BID COMPARISON
                  </span>
                </div>

                <QuoteComparison
                  quotes={quotes}
                  isCustomer={isCustomer}
                  isActionLoading={isActionLoading}
                  onAcceptQuote={handleAcceptQuote}
                  onDeclineQuote={handleDeclineQuote}
                />
              </div>

                {/* If logged in as REPAIRER: Show Quote Submission Form */}
                {isTechnician && (
                  <form
                    onSubmit={handleTechnicianSubmitQuote}
                    className="p-4 bg-stone-100/60 border border-stone-200 rounded-[2px] space-y-4 mt-6 text-xs"
                  >
                    <div className="border-b border-stone-200 pb-2">
                      <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] font-mono">
                        Technician Quote Submission
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Submit a formal quote for this open repair request under your verified workshop profile.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="quote-cost" className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Estimated Cost (₹) *
                        </label>
                        <input
                          id="quote-cost"
                          type="number"
                          min="100"
                          required
                          placeholder="e.g. 3500"
                          value={quoteCost}
                          onChange={(e) => setQuoteCost(e.target.value)}
                          className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="quote-days" className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Turnaround Time (Days) *
                        </label>
                        <input
                          id="quote-days"
                          type="number"
                          min="1"
                          max="30"
                          required
                          value={quoteDays}
                          onChange={(e) => setQuoteDays(e.target.value)}
                          className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="quote-notes" className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                        Scope of Work & Parts Notes
                      </label>
                      <textarea
                        id="quote-notes"
                        rows={2}
                        placeholder="Detail genuine replacement parts, warranty period, and disassembly notes..."
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? 'Submitting…' : 'Submit Formal Quote'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

          {/* PHASE B: Active Repair Job or Completed Repair */}
          {activeJob && (
            <div className="space-y-8">
              {/* Operational Split: Terms & Technician Left, State Machine Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Terms and Technician Details (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Assigned Specialist */}
                  <section className="space-y-2">
                    <div className="border-b border-stone-200 pb-2">
                      <h3 className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                        Assigned Specialist
                      </h3>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-stone-900 text-sm">
                        {activeJob.repairer?.businessName || 'Certified Technician'}
                      </div>
                      <div className="text-stone-600 flex items-center gap-1.5">
                        <span className="text-emerald-800 font-medium">
                          ★ {activeJob.repairer?.rating || '5.0'}
                        </span>
                        <span>•</span>
                        <span>{activeJob.repairer?.totalJobs || 0} jobs completed</span>
                      </div>
                      <div className="text-stone-500 flex items-center gap-1 text-[11px] pt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{activeJob.repairer?.address || 'Bengaluru, Karnataka'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Financial Terms */}
                  <section className="space-y-2">
                    <div className="border-b border-stone-200 pb-2">
                      <h3 className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                        Financial Terms
                      </h3>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-mono text-xl font-bold text-stone-900 tabular-nums">
                        ₹{(activeJob.actualCost || activeJob.agreedCost).toLocaleString('en-IN')}
                      </div>
                      <p className="text-stone-500 text-[11px]">
                        {activeJob.actualCost
                          ? 'Final invoiced repair cost including genuine parts and labor.'
                          : 'Agreed fixed quote. Sourced OEM replacement parts and labor.'}
                      </p>
                      <div className="text-emerald-800 font-medium text-[11px] pt-1">
                        ✓ Permanent Service Record Added to Passport on Handover
                      </div>
                    </div>
                  </section>

                  {/* Technician Controls (When logged in as assigned repairer or admin) */}
                  {(isTechnician || isAdmin) && activeJob.status !== 'COMPLETED' && (
                    <section className="p-4 bg-orange-50/70 border border-orange-200 rounded-[2px] space-y-3 text-xs">
                      <div className="border-b border-orange-200 pb-1.5">
                        <h4 className="font-bold text-orange-950 font-mono text-[11px] uppercase">
                          Technician Dispatch Control
                        </h4>
                        <p className="text-[11px] text-orange-800">
                          Advance the job state machine as service progresses on the bench.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activeJob.status === 'ACCEPTED' && (
                          <Button
                            variant="primary"
                            disabled={isActionLoading}
                            onClick={() => handleAdvanceJobStatus(activeJob.id, 'DIAGNOSING')}
                          >
                            Advance to DIAGNOSING
                          </Button>
                        )}
                        {activeJob.status === 'DIAGNOSING' && (
                          <>
                            <Button
                              variant="secondary"
                              disabled={isActionLoading}
                              onClick={() => handleAdvanceJobStatus(activeJob.id, 'WAITING_FOR_PART')}
                            >
                              Wait for Parts
                            </Button>
                            <Button
                              variant="primary"
                              disabled={isActionLoading}
                              onClick={() => handleAdvanceJobStatus(activeJob.id, 'REPAIRING')}
                            >
                              Advance to REPAIRING
                            </Button>
                          </>
                        )}
                        {activeJob.status === 'WAITING_FOR_PART' && (
                          <Button
                            variant="primary"
                            disabled={isActionLoading}
                            onClick={() => handleAdvanceJobStatus(activeJob.id, 'REPAIRING')}
                          >
                            Parts Arrived ➔ Begin REPAIRING
                          </Button>
                        )}
                        {activeJob.status === 'REPAIRING' && (
                          <Button
                            variant="primary"
                            disabled={isActionLoading}
                            onClick={() => handleAdvanceJobStatus(activeJob.id, 'TESTING')}
                          >
                            Advance to TESTING
                          </Button>
                        )}
                        {activeJob.status === 'TESTING' && (
                          <Button
                            variant="primary"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleAdvanceJobStatus(
                                activeJob.id,
                                'COMPLETED',
                                activeJob.agreedCost
                              )
                            }
                          >
                            Pass Quality Bench ➔ Mark COMPLETED
                          </Button>
                        )}
                      </div>
                    </section>
                  )}
                </div>

                {/* Right: State Machine Progression Timeline (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="border-b border-stone-200 pb-2 flex items-baseline justify-between">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                      Lifecycle State Machine Progression
                    </h3>
                    <span className="font-mono text-[10px] text-stone-400">
                      STAGE: {activeJob.status}
                    </span>
                  </div>

                  {/* Contextual What Happens Next Card */}
                  {(() => {
                    const info = getJobStatusExplanation(activeJob.status);
                    const isCompleted = activeJob.status === 'COMPLETED';
                    const isCancelled = activeJob.status === 'CANCELLED';
                    return (
                      <div
                        className={`p-4 rounded-[2px] border space-y-2 ${
                          isCompleted
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : isCancelled
                            ? 'bg-stone-100 border-stone-300'
                            : 'bg-orange-50/60 border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                              What happens next
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-xs font-bold text-stone-900 font-mono">
                              {info.stageName}
                            </span>
                          </div>
                          {isCompleted ? (
                            <Badge variant="success" size="sm" dot>
                              VERIFIED COMPLETED
                            </Badge>
                          ) : isCancelled ? (
                            <Badge variant="neutral" size="sm">
                              TERMINATED
                            </Badge>
                          ) : (
                            <Badge variant="rust" size="sm" dot>
                              ACTIVE BENCH
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed font-sans">
                          {info.desc}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-stone-500 pt-1.5 border-t border-stone-200/60">
                          <div>
                            <span>Job Started: </span>
                            <span className="text-stone-800 font-semibold">
                              {new Date(activeJob.startedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {activeJob.completedAt && (
                            <div>
                              <span>Completed: </span>
                              <span className="text-stone-800 font-semibold">
                                {new Date(activeJob.completedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <Timeline steps={buildTimelineSteps(activeJob.status)} />
                </div>
              </div>

              {/* Customer Review Section for Completed Jobs */}
              {activeJob.status === 'COMPLETED' && (
                <section className="border-t border-stone-200 pt-6 space-y-4">
                  <div className="border-b border-stone-200 pb-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                        REPAIR COMPLETED
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                        How did the repair go?
                      </h3>
                      <p className="text-xs text-stone-500">
                        Customer rating updates the technician&apos;s verified reputation in the public registry.
                      </p>
                    </div>
                    <Badge variant="success" size="sm" dot>
                      Service Finalized
                    </Badge>
                  </div>

                  {/* If review already exists */}
                  {activeJob.review || reviewSubmitted ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="p-4 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (activeJob.review?.rating || rating)
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-stone-300'
                            }`}
                          />
                        ))}
                        <span className="text-stone-700 font-bold ml-1.5">
                          {activeJob.review?.rating || rating}.0
                        </span>
                      </div>
                      <p className="text-stone-700 italic">
                        &ldquo;{activeJob.review?.comment || reviewComment}&rdquo;
                      </p>
                      <div className="text-[10px] font-mono text-stone-400 pt-1">
                        Verified customer review logged into technician quality ledger.
                      </div>
                    </div>
                  ) : isCustomer ? (
                    /* Review Form */
                    <form
                      onSubmit={(e) => handleReviewSubmit(e, activeJob.id)}
                      className="p-4 bg-white border border-stone-200 rounded-[2px] space-y-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <label id="review-rating-label" className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Rating (1 to 5 Stars)
                        </label>
                        <div role="radiogroup" aria-labelledby="review-rating-label" className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              id={`review-star-${star}`}
                              type="button"
                              role="radio"
                              tabIndex={star === rating ? 0 : -1}
                              aria-checked={star === rating}
                              aria-label={`${star} star${star > 1 ? 's' : ''}`}
                              onClick={() => setRating(star)}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  const next = Math.min(5, star + 1);
                                  setRating(next);
                                  document.getElementById(`review-star-${next}`)?.focus();
                                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  const prev = Math.max(1, star - 1);
                                  setRating(prev);
                                  document.getElementById(`review-star-${prev}`)?.focus();
                                }
                              }}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[2px] text-stone-400 hover:text-amber-500 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= rating
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-stone-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="review-comment" className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Review Comments
                        </label>
                        <textarea
                          id="review-comment"
                          rows={3}
                          required
                          placeholder="Describe service quality, turnaround adherence, and device operating condition..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-[2px] text-stone-900 focus:outline-none focus:border-stone-500 focus-visible:ring-2 focus-visible:ring-stone-400"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? 'Submitting…' : 'Submit Verified Review'}
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
