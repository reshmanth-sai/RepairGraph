'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  repairRequestsApi,
  repairJobsApi,
  repairersApi,
  ApiRepairRequest,
  ApiRepairJob,
  ApiRepairer,
} from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuoteModal } from '@/components/marketplace/QuoteModal';
import { JobStatusStepper } from '@/components/marketplace/JobStatusStepper';
import {
  Wrench,
  Cpu,
  AlertCircle,
  MapPin,
  Star,
  ShieldCheck,
  Send,
  RefreshCw,
} from 'lucide-react';

interface SpecializationMatch {
  type: 'EXACT' | 'CATEGORY' | 'NONE';
  label: string;
}

function getSpecializationMatch(
  deviceCategory?: string,
  deviceBrand?: string,
  specializations?: Array<{ deviceCategory: string; brand: string; serviceType: string }>
): SpecializationMatch {
  if (!deviceCategory || !specializations || specializations.length === 0) {
    return { type: 'NONE', label: '' };
  }

  const exact = specializations.find(
    (s) =>
      s.deviceCategory.toUpperCase() === deviceCategory.toUpperCase() &&
      s.brand.toLowerCase() === (deviceBrand || '').toLowerCase()
  );

  if (exact) {
    return {
      type: 'EXACT',
      label: `SPECIALTY MATCH • ${exact.brand} ${exact.deviceCategory.toLowerCase()}`,
    };
  }

  const categoryMatch = specializations.find(
    (s) => s.deviceCategory.toUpperCase() === deviceCategory.toUpperCase()
  );

  if (categoryMatch) {
    return {
      type: 'CATEGORY',
      label: `PARTIAL MATCH • ${categoryMatch.deviceCategory.toLowerCase()} (Brand not listed)`,
    };
  }

  return { type: 'NONE', label: '' };
}

export default function RepairerWorkbenchPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Active View State
  const [activeTab, setActiveTab] = useState<'bench' | 'requests' | 'history'>('bench');

  // Workshop Profile Data
  const [technicianProfile, setTechnicianProfile] = useState<ApiRepairer | null>(null);

  // Open Requests Deck State
  const [openRequests, setOpenRequests] = useState<ApiRepairRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<ApiRepairRequest | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Active Jobs Deck State
  const [jobs, setJobs] = useState<ApiRepairJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotingRequest, setQuotingRequest] = useState<ApiRepairRequest | null>(null);

  // Access Control Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/repairer');
      } else if (user.role === 'USER') {
        router.push('/repairs');
      }
    }
  }, [user, authLoading, router]);

  // Load Technician's Repairer Profile
  const loadTechnicianProfile = useCallback(async () => {
    try {
      // Find workshop profile from user session or directory
      const list = await repairersApi.list({ limit: 50 });
      const match = Array.isArray(list) ? list.find((r) => r.userId === user?.id) : null;
      if (match) {
        const full = await repairersApi.getById(match.id);
        setTechnicianProfile(full);
      }
    } catch {
      // Non-critical, fallback to general workshop display
    }
  }, [user]);

  // Load Open Requests
  const loadOpenRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await repairRequestsApi.list({ status: 'REQUESTED' });
      const list = Array.isArray(data) ? data : [];
      setOpenRequests(list);
      if (list.length > 0) {
        setSelectedRequestId((prev) => (prev && list.some((r) => r.id === prev) ? prev : list[0].id));
      } else {
        setSelectedRequestId(null);
        setSelectedRequestDetail(null);
      }
    } catch (err: unknown) {
      setRequestsError(err instanceof Error ? err.message : 'Failed to retrieve open requests.');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // Load Request Detail for Selected Request
  const loadSelectedDetail = useCallback(async (reqId: string) => {
    try {
      const detail = await repairRequestsApi.getById(reqId);
      setSelectedRequestDetail(detail);
    } catch {
      // Fallback
    }
  }, []);

  // Load Active & Completed Jobs
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await repairJobsApi.list();
      const list = Array.isArray(data) ? data : [];
      setJobs(list);
    } catch (err: unknown) {
      setJobsError(err instanceof Error ? err.message : 'Failed to retrieve workbench jobs.');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'REPAIRER' || user.role === 'ADMIN')) {
      loadTechnicianProfile();
      loadOpenRequests();
      loadJobs();
    }
  }, [user, loadTechnicianProfile, loadOpenRequests, loadJobs]);

  useEffect(() => {
    if (selectedRequestId) {
      loadSelectedDetail(selectedRequestId);
    }
  }, [selectedRequestId, loadSelectedDetail]);

  // Filter Active vs Completed Jobs
  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED'),
    [jobs]
  );
  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'COMPLETED'),
    [jobs]
  );

  // Check if technician already submitted a quote for selected request
  const existingQuoteForSelected = useMemo(() => {
    if (!selectedRequestDetail || !technicianProfile) return null;
    return selectedRequestDetail.quotes?.find((q) => q.repairerId === technicianProfile.id);
  }, [selectedRequestDetail, technicianProfile]);

  const specializationMatch = useMemo(() => {
    if (!selectedRequestDetail || !technicianProfile) return { type: 'NONE', label: '' };
    return getSpecializationMatch(
      selectedRequestDetail.device?.category,
      selectedRequestDetail.device?.brand,
      technicianProfile.specializations
    );
  }, [selectedRequestDetail, technicianProfile]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="py-24 text-center font-mono text-xs text-stone-400 space-y-2">
        <div className="w-2 h-2 rounded-full bg-orange-700 animate-ping mx-auto" />
        <div>AUTHENTICATING OPERATIONAL BENCH ACCESS…</div>
      </div>
    );
  }

  if (user && user.role === 'USER') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-600">
          <Wrench className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            The Repairer Workbench is an operational console reserved for registered technician accounts. You are currently signed in as a Consumer.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/repairs">
            <Button variant="primary">Go to Your Repairs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Workshop Identity Header */}
      <header className="border-b border-stone-200 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-800 font-bold">
                OPERATIONAL CONSOLE
              </span>
              <Badge variant="success" size="sm" dot>
                {technicianProfile?.verificationStatus === 'VERIFIED'
                  ? 'VERIFIED WORKSHOP'
                  : 'REGISTERED TECHNICIAN'}
              </Badge>
              <span className="text-xs text-stone-400 font-mono">
                SESSION: {user?.email}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {technicianProfile?.businessName || user?.name || 'Technician Bench'}
            </h1>

            {technicianProfile?.address && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{technicianProfile.address}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-3 h-3" />}
              onClick={() => {
                loadOpenRequests();
                loadJobs();
              }}
            >
              Sync Bench
            </Button>
            {technicianProfile && (
              <Link href={`/repairers/${technicianProfile.id}`}>
                <Button variant="ghost" size="sm">
                  Public Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Live Operational Metrics Strip */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-stone-600">
          <div>
            <span className="text-stone-400">ACTIVE ON BENCH: </span>
            <strong className="text-stone-950 font-bold">{activeJobs.length} jobs</strong>
          </div>
          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">|</span>
          <div>
            <span className="text-stone-400">OPEN TICKETS AVAILABLE: </span>
            <strong className="text-stone-950 font-bold">{openRequests.length} requests</strong>
          </div>
          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">|</span>
          <div>
            <span className="text-stone-400">TOTAL COMPLETED: </span>
            <strong className="text-stone-950 font-bold">{completedJobs.length} jobs</strong>
          </div>
          {technicianProfile && (
            <>
              <span className="text-stone-300 hidden sm:inline" aria-hidden="true">|</span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <strong className="text-stone-950 font-bold">
                  {technicianProfile.rating.toFixed(1)}
                </strong>
                <span className="text-stone-400">
                  ({technicianProfile._count?.reviews || 0} reviews)
                </span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Primary Section Switcher Tabs */}
      <div role="tablist" aria-label="Workbench views" className="flex border-b border-stone-200">
        <button
          type="button"
          role="tab"
          id="tab-wb-bench"
          aria-selected={activeTab === 'bench'}
          tabIndex={activeTab === 'bench' ? 0 : -1}
          onClick={() => setActiveTab('bench')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveTab('requests');
              document.getElementById('tab-wb-requests')?.focus();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveTab('history');
              document.getElementById('tab-wb-history')?.focus();
            }
          }}
          className={`min-h-[44px] pb-3 text-xs font-bold font-mono tracking-wider transition-colors border-b-2 mr-8 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeTab === 'bench'
              ? 'border-stone-900 text-stone-950'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>ACTIVE BENCH ({activeJobs.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-wb-requests"
          aria-selected={activeTab === 'requests'}
          tabIndex={activeTab === 'requests' ? 0 : -1}
          onClick={() => setActiveTab('requests')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveTab('history');
              document.getElementById('tab-wb-history')?.focus();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveTab('bench');
              document.getElementById('tab-wb-bench')?.focus();
            }
          }}
          className={`min-h-[44px] pb-3 text-xs font-bold font-mono tracking-wider transition-colors border-b-2 mr-8 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeTab === 'requests'
              ? 'border-stone-900 text-stone-950'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>OPEN REQUESTS & QUOTING ({openRequests.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-wb-history"
          aria-selected={activeTab === 'history'}
          tabIndex={activeTab === 'history' ? 0 : -1}
          onClick={() => setActiveTab('history')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveTab('bench');
              document.getElementById('tab-wb-bench')?.focus();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveTab('requests');
              document.getElementById('tab-wb-requests')?.focus();
            }
          }}
          className={`min-h-[44px] pb-3 text-xs font-bold font-mono tracking-wider transition-colors border-b-2 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeTab === 'history'
              ? 'border-stone-900 text-stone-950'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>COMPLETED HISTORY ({completedJobs.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE JOBS ON BENCH */}
      {activeTab === 'bench' && (
        <section aria-labelledby="bench-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="bench-heading" className="text-sm font-bold text-stone-900 tracking-tight font-mono uppercase">
                Hardware Currently On Bench
              </h2>
              <p className="text-xs text-stone-500">
                Jobs accepted and assigned to your workshop. Advance stages from diagnostics to completion.
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {activeJobs.length} JOBS PENDING
            </Badge>
          </div>

          {jobsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-stone-100 rounded-[3px] border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : jobsError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-[3px] text-xs text-red-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Error retrieving active jobs</span>
              </div>
              <p>{jobsError}</p>
              <Button variant="secondary" size="sm" onClick={loadJobs}>
                Retry
              </Button>
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-[3px] p-12 text-center space-y-3 shadow-2xs">
              <Wrench className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                Bench is Clear — No Active Jobs
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                You currently have no jobs in progress. Review incoming customer requests in the Quoting Deck to submit service bids.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={() => setActiveTab('requests')}>
                  Inspect Open Requests ({openRequests.length})
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-stone-300 rounded-[3px] shadow-2xs overflow-hidden"
                >
                  {/* Job Header Strip */}
                  <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-stone-900">
                        JOB #{job.id.slice(-6)}
                      </span>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-600">
                        TICKET #{job.repairRequestId.slice(-6)}
                      </span>
                      <span className="text-stone-300">|</span>
                      <span className="text-stone-800 font-semibold">
                        {job.repairRequest?.device?.brand} {job.repairRequest?.device?.model}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-stone-600">
                      <div>
                        AGREED FEE:{' '}
                        <strong className="text-stone-900 font-bold">
                          ₹{job.agreedCost.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <span className="text-stone-300">|</span>
                      <div>
                        STARTED: {new Date(job.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Job Body */}
                  <div className="p-5 space-y-5">
                    {/* Customer Reported Problem */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                        Customer Fault Report
                      </div>
                      <p className="text-xs text-stone-800 bg-stone-50/70 p-2.5 rounded-[2px] border border-stone-200/80 leading-relaxed font-sans">
                        &ldquo;{job.repairRequest?.description}&rdquo;
                      </p>
                    </div>

                    {/* Operational Stepper & Next Actions */}
                    <JobStatusStepper job={job} onStatusUpdated={loadJobs} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: OPEN REQUESTS & QUOTE DECK */}
      {activeTab === 'requests' && (
        <section aria-labelledby="requests-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="requests-heading" className="text-sm font-bold text-stone-900 tracking-tight font-mono uppercase">
                Incoming Customer Fault Reports (Quote Deck)
              </h2>
              <p className="text-xs text-stone-500">
                Inspect AI-assisted diagnostic reports and submit official commercial quotes directly to customers.
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {openRequests.length} AVAILABLE FOR QUOTING
            </Badge>
          </div>

          {requestsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-stone-100 rounded-[3px] border border-stone-200 animate-pulse" />
                ))}
              </div>
              <div className="lg:col-span-2 h-96 bg-stone-100 rounded-[3px] border border-stone-200 animate-pulse" />
            </div>
          ) : requestsError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-[3px] text-xs text-red-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Error retrieving open requests</span>
              </div>
              <p>{requestsError}</p>
              <Button variant="secondary" size="sm" onClick={loadOpenRequests}>
                Retry
              </Button>
            </div>
          ) : openRequests.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-[3px] p-12 text-center space-y-3 shadow-2xs">
              <Cpu className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                No Open Repair Requests
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                All currently reported customer requests have active jobs or are already being serviced.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Pane: Requests List */}
              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {openRequests.map((req) => {
                  const isSelected = req.id === selectedRequestId;
                  const match = getSpecializationMatch(
                    req.device?.category,
                    req.device?.brand,
                    technicianProfile?.specializations
                  );

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`p-4 rounded-[3px] border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-stone-900 shadow-xs ring-1 ring-stone-900'
                          : 'bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-stone-400">
                            #{req.id.slice(-6)}
                          </span>
                          <h4 className="text-xs font-bold text-stone-950 truncate">
                            {req.device?.brand} {req.device?.model}
                          </h4>
                        </div>
                        <Badge
                          variant={
                            req.urgency === 'HIGH'
                              ? 'error'
                              : req.urgency === 'MEDIUM'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {req.urgency}
                        </Badge>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 mt-2 leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-100 text-[11px] font-mono text-stone-500">
                        <span className="capitalize">{req.device?.category?.toLowerCase()}</span>
                        {match.type !== 'NONE' && (
                          <span className="text-emerald-700 font-medium text-[10px]">
                            {match.type === 'EXACT' ? '★ Specialty Match' : 'Category Match'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Pane: Selected Request Full Inspection & Diagnostic Assessment */}
              <div className="lg:col-span-2">
                {selectedRequestDetail ? (
                  <div className="bg-white border border-stone-300 rounded-[3px] p-6 space-y-6 shadow-xs">
                    {/* Header Strip */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-stone-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-stone-900">
                            TICKET #{selectedRequestDetail.id.slice(-6)}
                          </span>
                          <Badge variant="neutral" size="sm">
                            {selectedRequestDetail.status}
                          </Badge>
                          {specializationMatch.type !== 'NONE' && (
                            <Badge variant="success" size="sm">
                              {specializationMatch.label}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-stone-950 tracking-tight">
                          {selectedRequestDetail.device?.brand} {selectedRequestDetail.device?.model}
                        </h3>
                        <div className="text-xs font-mono text-stone-500">
                          Serial: {selectedRequestDetail.device?.serialNumber || 'N/A'} • Category: {selectedRequestDetail.device?.category}
                        </div>
                      </div>

                      <div>
                        {existingQuoteForSelected ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[2px] text-right font-mono text-xs">
                            <div className="text-emerald-800 font-bold">
                              Quote Submitted
                            </div>
                            <div className="text-emerald-700">
                              ₹{existingQuoteForSelected.estimatedCost.toLocaleString('en-IN')} • {existingQuoteForSelected.estimatedDays} days
                            </div>
                            <div className="text-[10px] text-emerald-600 uppercase font-semibold">
                              Status: {existingQuoteForSelected.status}
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="accent"
                            size="md"
                            icon={<Send className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setQuotingRequest(selectedRequestDetail);
                              setIsQuoteModalOpen(true);
                            }}
                          >
                            Submit Official Quote
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Customer Reported Symptoms */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold">
                        Customer Reported Fault Description
                      </div>
                      <div className="p-3.5 bg-stone-50 rounded-[2px] border border-stone-200 text-xs text-stone-900 leading-relaxed font-sans">
                        &ldquo;{selectedRequestDetail.description}&rdquo;
                      </div>
                    </div>

                    {/* RepairGraph Diagnostic Assessment Box */}
                    {selectedRequestDetail.diagnosis || selectedRequestDetail.recommendation ? (
                      <div className="space-y-4 pt-2 border-t border-stone-200">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-mono uppercase tracking-wider text-orange-800 font-bold flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-orange-700" />
                            <span>RepairGraph Automated Diagnostic Triage</span>
                          </div>
                          <span className="text-[10px] font-mono text-stone-400">
                            Deterministic Engine Analysis
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                          {/* Signal 1: Issue */}
                          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                            <span className="text-[10px] text-stone-400 uppercase">Suspected Issue</span>
                            <div className="font-bold text-stone-900">
                              {selectedRequestDetail.diagnosis?.possibleIssue || 'General Hardware Malfunction'}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              Confidence: {selectedRequestDetail.diagnosis?.confidence?.toFixed(0)}%
                            </div>
                          </div>

                          {/* Signal 2: Repairability Score */}
                          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                            <span className="text-[10px] text-stone-400 uppercase">Repairability Index</span>
                            <div className="font-bold text-stone-900 text-sm">
                              {selectedRequestDetail.recommendation?.repairabilityScore?.toFixed(0)} / 100
                            </div>
                            <div className="text-[11px] text-stone-500">
                              Action: {selectedRequestDetail.recommendation?.recommendedAction}
                            </div>
                          </div>

                          {/* Signal 3: Estimated Cost Benchmark */}
                          <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                            <span className="text-[10px] text-stone-400 uppercase">Benchmark Cost Range</span>
                            <div className="font-bold text-stone-900">
                              ₹{selectedRequestDetail.recommendation?.estimatedCostMin?.toLocaleString('en-IN')} – ₹
                              {selectedRequestDetail.recommendation?.estimatedCostMax?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              Economic Score: {selectedRequestDetail.recommendation?.economicScore?.toFixed(0)} / 100
                            </div>
                          </div>
                        </div>

                        {/* Evidence Points */}
                        {selectedRequestDetail.diagnosis?.evidence &&
                          selectedRequestDetail.diagnosis.evidence.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                                Diagnostic Evidence Points
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-stone-600 font-mono">
                                {selectedRequestDetail.diagnosis.evidence.map((ev, i) => (
                                  <li key={i}>{ev}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="p-4 bg-stone-50 rounded-[2px] border border-stone-200 text-xs text-stone-500 font-mono">
                        No automated diagnostic telemetry generated for this ticket.
                      </div>
                    )}

                    {/* Competitor / Existing Quotes Count */}
                    <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-500">
                      <span>Total Quotes on Ticket: {selectedRequestDetail.quotes?.length || 0}</span>
                      <span className="text-[10px] text-stone-400">
                        Binding upon customer acceptance
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-stone-400 border border-stone-200 rounded-[3px] bg-white">
                    Select an open ticket from the left deck to view diagnostic assessment and submit a quote.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: COMPLETED SERVICE HISTORY */}
      {activeTab === 'history' && (
        <section aria-labelledby="history-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="history-heading" className="text-sm font-bold text-stone-900 tracking-tight font-mono uppercase">
                Completed Workshop Service Records
              </h2>
              <p className="text-xs text-stone-500">
                Permanently verified service records inscribed into digital Repair Passports.
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {completedJobs.length} JOBS INSCRIBED
            </Badge>
          </div>

          {completedJobs.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-[3px] p-12 text-center space-y-2 shadow-2xs">
              <ShieldCheck className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                No Completed Records Yet
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                As active bench repairs are completed and tested, their permanent service history logs will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-[3px] overflow-hidden divide-y divide-stone-100 shadow-2xs">
              {completedJobs.map((job) => (
                <div key={job.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-mono text-stone-900">
                        {job.repairRequest?.device?.brand} {job.repairRequest?.device?.model}
                      </span>
                      <Badge variant="success" size="sm" dot>
                        PASSPORT VERIFIED
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-1">
                      {job.notes || 'Hardware service tested and finalized.'}
                    </p>
                    <div className="text-[10px] font-mono text-stone-400 flex items-center gap-3">
                      <span>JOB #{job.id.slice(-6)}</span>
                      <span>•</span>
                      <span>
                        COMPLETED:{' '}
                        {job.completedAt
                          ? new Date(job.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs">
                    <div className="text-stone-400 text-[10px]">FINAL COST</div>
                    <div className="font-bold text-stone-900 text-sm">
                      ₹{(job.actualCost ?? job.agreedCost).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quote Submission Modal */}
      {quotingRequest && (
        <QuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setQuotingRequest(null);
          }}
          repairRequest={quotingRequest}
          onQuoteSubmitted={() => {
            loadOpenRequests();
            if (selectedRequestId) {
              loadSelectedDetail(selectedRequestId);
            }
          }}
        />
      )}
    </div>
  );
}
