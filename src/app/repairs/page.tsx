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
import { Timeline, TimelineStep } from '@/components/ui/Timeline';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Wrench,
  MapPin,
  AlertCircle,
  Star,
} from 'lucide-react';

export default function RepairsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApiRepairRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApiRepairRequest | null>(null);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Technician Quote Form State
  const [quoteCost, setQuoteCost] = useState('');
  const [quoteDays, setQuoteDays] = useState('2');
  const [quoteNotes, setQuoteNotes] = useState('');

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
  const handleAcceptQuote = async (quoteId: string) => {
    if (!window.confirm('Accept this quote? Competing quotes will be declined and the active repair job will begin.')) {
      return;
    }
    setIsActionLoading(true);
    try {
      await quotesApi.updateStatus(quoteId, { status: 'ACCEPTED' });
      if (selectedRequestId) {
        await loadRequestDetail(selectedRequestId);
        await loadRequests();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to accept quote.');
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
      alert(err instanceof Error ? err.message : 'Failed to update job status.');
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
      alert(err instanceof Error ? err.message : 'Failed to submit review.');
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
          { label: 'Overview', href: '/' },
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
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mr-2 shrink-0">
                ACTIVE TICKETS:
              </span>
              {requests.map((r) => {
                const isSelected = r.id === selectedRequestId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRequestId(r.id)}
                    className={`px-3 py-1.5 text-xs rounded-[2px] font-medium transition-colors shrink-0 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'text-stone-600 hover:text-stone-900 bg-stone-100'
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
                  <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                    Quotes Received ({quotes.length})
                  </h3>
                  <span className="text-[10px] font-mono text-stone-400">
                    COMPETITIVE ESTIMATES
                  </span>
                </div>

                {quotes.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-stone-200 rounded-[2px] text-xs text-stone-500">
                    No quotes submitted yet. Verified technicians in your area are reviewing the technical symptoms.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="p-4 bg-white border border-stone-200 rounded-[2px] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-100 pb-2.5">
                          <div>
                            <div className="font-bold text-stone-900 text-sm">
                              {quote.repairer.businessName}
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-2 pt-0.5">
                              <span className="text-emerald-800 font-medium">★ {quote.repairer.rating}</span>
                              <span>•</span>
                              <span>{quote.repairer.totalJobs} jobs completed</span>
                              <span>•</span>
                              <span className="text-stone-400">{quote.repairer.address}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-lg font-bold text-stone-900 tabular-nums">
                              ₹{quote.estimatedCost.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              Est. {quote.estimatedDays} business {quote.estimatedDays === 1 ? 'day' : 'days'}
                            </div>
                          </div>
                        </div>

                        {quote.notes && (
                          <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-[2px] border border-stone-200 font-mono text-[11px]">
                            {quote.notes}
                          </div>
                        )}

                        {/* Customer can accept quote */}
                        {isCustomer && quote.status === 'PENDING' && (
                          <div className="pt-1 flex justify-end">
                            <Button
                              variant="primary"
                              disabled={isActionLoading}
                              onClick={() => handleAcceptQuote(quote.id)}
                            >
                              {isActionLoading ? 'Processing…' : 'Accept Quote & Begin Repair'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
                        <label className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Estimated Cost (₹) *
                        </label>
                        <input
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
                        <label className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Turnaround Time (Days) *
                        </label>
                        <input
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
                      <label className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                        Scope of Work & Parts Notes
                      </label>
                      <textarea
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
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                      Lifecycle State Machine Progression
                    </h3>
                    <span className="font-mono text-[10px] text-stone-400">
                      STAGE: {activeJob.status}
                    </span>
                  </div>

                  <Timeline steps={buildTimelineSteps(activeJob.status)} />
                </div>
              </div>

              {/* Customer Review Section for Completed Jobs */}
              {activeJob.status === 'COMPLETED' && (
                <section className="border-t border-stone-200 pt-6 space-y-4">
                  <div className="border-b border-stone-200 pb-2 flex items-baseline justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                        Verified Repair Review & Quality Feedback
                      </h3>
                      <p className="text-xs text-stone-500">
                        Customer rating affects technician tier rating and secondary device confidence.
                      </p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>

                  {/* If review already exists */}
                  {activeJob.review || reviewSubmitted ? (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs">
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
                      <div className="space-y-1">
                        <label className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Rating (1 to 5 Stars)
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="p-1 focus:outline-none"
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
                        <label className="block font-mono text-[10px] uppercase font-bold text-stone-600">
                          Review Comments
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Describe service quality, turnaround adherence, and device operating condition..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full p-2.5 bg-white border border-stone-300 rounded-[2px] text-stone-900"
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
