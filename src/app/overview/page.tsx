'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  devicesApi,
  repairRequestsApi,
  ApiDevice,
  ApiRepairRequest,
  JobStatus
} from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Timeline, TimelineStep } from '@/components/ui/Timeline';
import { AttentionBanner } from '@/components/ui/AttentionBanner';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  ArrowRight,
  Laptop,
  Smartphone,
  Headphones,
  Tv,
  Tablet,
  AlertCircle,
  Wrench,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [requests, setRequests] = useState<ApiRepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [devicesData, requestsData] = await Promise.all([
        devicesApi.list(),
        repairRequestsApi.list(),
      ]);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err: unknown) {
      // If unauthenticated, don't show loud error; user can sign in
      if (user) {
        setError(err instanceof Error ? err.message : 'Failed to synchronize dashboard data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);



  const getWarrantyStatus = (warrantyExpiry?: string | null) => {
    if (!warrantyExpiry) return 'expired';
    const exp = new Date(warrantyExpiry).getTime();
    const now = Date.now();
    if (exp <= now) return 'expired';
    if (exp - now < 30 * 24 * 3600 * 1000) return 'expiring_soon';
    return 'active';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP':
      case 'laptop':
        return <Laptop className="w-3.5 h-3.5 text-stone-600" />;
      case 'SMARTPHONE':
      case 'smartphone':
        return <Smartphone className="w-3.5 h-3.5 text-stone-600" />;
      case 'HEADPHONES':
      case 'audio':
        return <Headphones className="w-3.5 h-3.5 text-stone-600" />;
      case 'MONITOR':
        return <Tv className="w-3.5 h-3.5 text-stone-600" />;
      case 'TABLET':
        return <Tablet className="w-3.5 h-3.5 text-stone-600" />;
      default:
        return <Laptop className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
      case 'excellent':
        return <Badge variant="success">Excellent</Badge>;
      case 'GOOD':
      case 'good':
        return <Badge variant="neutral">Good</Badge>;
      case 'FAIR':
      case 'fair':
        return <Badge variant="warning">Fair</Badge>;
      case 'DEGRADED':
      case 'degraded':
      case 'CRITICAL':
      case 'critical':
        return <Badge variant="error">Degraded</Badge>;
      default:
        return <Badge variant="neutral">{condition}</Badge>;
    }
  };

  const getWarrantyBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" dot>Active</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning" dot>Expiring</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">Unregistered</Badge>;
    }
  };

  // 1. "What needs my attention?" -> Find active/urgent request
  const attentionRequest = requests.find(
    (r) => r.status === 'REQUESTED' || r.urgency === 'HIGH'
  );

  // 2. In-flight active repair job
  const activeJobRequest = requests.find(
    (r) =>
      r.repairJob &&
      r.repairJob.status !== 'COMPLETED' &&
      r.repairJob.status !== 'CANCELLED'
  );
  const activeJob = activeJobRequest?.repairJob;

  // Fallback to a completed job if no active job in workshop
  const completedJobRequest = requests.find(
    (r) => r.repairJob && r.repairJob.status === 'COMPLETED'
  );
  const displayJob = activeJob || completedJobRequest?.repairJob;
  const displayJobDevice = activeJobRequest?.device || completedJobRequest?.device;

  // Mini timeline generator for dashboard
  const buildMiniTimeline = (status: JobStatus): TimelineStep[] => {
    const stages: Array<{ id: JobStatus; label: string; note: string }> = [
      { id: 'ACCEPTED', label: 'Quote Accepted', note: 'Customer accepted specialist quote' },
      { id: 'DIAGNOSING', label: 'Component Diagnostics', note: 'Oscilloscope & thermal inspection' },
      { id: 'WAITING_FOR_PART', label: 'Parts Procurement', note: 'OEM components in transit' },
      { id: 'REPAIRING', label: 'Hardware Servicing', note: 'Installation & micro-soldering' },
      { id: 'TESTING', label: 'Stress Validation', note: 'Thermal loop & load testing' },
      { id: 'COMPLETED', label: 'Handover & Stamped', note: 'Warranty active on passport' },
    ];
    const stageOrder: JobStatus[] = ['ACCEPTED', 'DIAGNOSING', 'WAITING_FOR_PART', 'REPAIRING', 'TESTING', 'COMPLETED'];
    const currentIdx = stageOrder.indexOf(status);

    return stages.slice(1, 5).map((stage, idx) => {
      const realIdx = idx + 1;
      return {
        stage: stage.id,
        label: stage.label,
        note: stage.note,
        completed: realIdx < currentIdx || status === 'COMPLETED',
        current: realIdx === currentIdx && status !== 'COMPLETED',
      };
    });
  };

  // Recent activity synthesis from live records
  const recentActivities = [
    ...requests.map((r) => ({
      id: `req-${r.id}`,
      title: `Repair Request: ${r.device?.brand || 'Device'} ${r.device?.model || ''}`,
      timestamp: new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      description: `${r.status} — ${r.description.slice(0, 75)}...`,
    })),
    ...devices.map((d) => ({
      id: `dev-${d.id}`,
      title: `Hardware Registered: ${d.brand} ${d.model}`,
      timestamp: new Date(d.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      description: `SN: ${d.serialNumber} • Initial condition: ${d.condition}`,
    })),
  ].slice(0, 4);

  return (
    <div className="space-y-10">
      {/* 1. Header & Primary Intent */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Overview
            </h1>
            {user && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-stone-100 text-stone-600 border border-stone-200">
                {user.role} SESSION
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Hardware lifecycle status, pending evaluations, and active repair telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/report">
            <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
              Report a Problem
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[2px] flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadDashboardData()} className="font-semibold underline font-mono">
            Retry
          </button>
        </div>
      )}

      {/* Unauthenticated Onboarding Notice */}
      {!user && !authLoading && (
        <section className="p-5 bg-stone-100/70 border border-stone-200 rounded-[2px] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-stone-900">
                Sign in to manage personal hardware & repair requests
              </h2>
              <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
                You are viewing the platform as an anonymous guest. Sign in with the seeded demonstration accounts to inspect live devices, accept quotes, and test technician dispatch workflows.
              </p>
            </div>
            <Link href="/login">
              <Button variant="primary">
                Sign In / Demo Switcher →
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* 2. Primary Attention Notice: What needs my attention? */}
      {attentionRequest && (
        <section aria-labelledby="attention-heading">
          <AttentionBanner
            title={`${attentionRequest.device?.brand || 'Hardware'} ${attentionRequest.device?.model || 'Unit'} — ${
              attentionRequest.diagnosis?.possibleIssue || 'Symptom Triage Pending'
            }`}
            description={attentionRequest.recommendation?.reasoning || attentionRequest.description}
            meta={`Reported ${new Date(attentionRequest.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric'
            })} • Status: ${attentionRequest.status} • Urgency: ${attentionRequest.urgency}`}
            actionText="Review Ticket in Repairs"
            actionHref="/repairs"
          />
        </section>
      )}

      {/* 3. Operational Split: Current Active Repair & Registered Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Registered Hardware Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-baseline justify-between border-b border-stone-200 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                Registered Hardware
              </h2>
              <p className="text-[11px] text-stone-500">
                Devices monitored for repairability and maintenance records.
              </p>
            </div>
            <Link
              href="/devices"
              className="text-xs font-semibold text-stone-700 hover:text-stone-950 inline-flex items-center gap-1 group"
            >
              <span>View All ({devices.length})</span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center font-mono text-xs text-stone-400">
              SYNCING HARDWARE CATALOG…
            </div>
          ) : devices.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-stone-200 rounded-[2px] space-y-2 text-xs text-stone-500">
              <p>No devices currently registered in your catalog.</p>
              <Link href="/devices">
                <Button variant="secondary" size="sm">
                  Add First Device
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      <th className="py-2.5 pr-4 font-semibold">Device</th>
                      <th className="py-2.5 px-3 font-semibold">Condition</th>
                      <th className="py-2.5 px-3 font-semibold">Diagnostic Assessment</th>
                      <th className="py-2.5 px-3 font-semibold">Warranty</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {devices.slice(0, 4).map((device) => {
                      const matchedRequest = requests.find((r) => r.deviceId === device.id);
                      const recommendation = matchedRequest?.recommendation;
                      const warrantyStatus = getWarrantyStatus(device.warrantyExpiry);

                      return (
                        <tr
                          key={device.id}
                          className="hover:bg-stone-100/40 transition-colors group"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1 rounded-[2px] bg-stone-100 text-stone-700 shrink-0">
                                {getCategoryIcon(device.category)}
                              </div>
                              <div>
                                <Link
                                  href={`/devices/${device.id}`}
                                  className="font-semibold text-stone-900 hover:text-orange-800 transition-colors block tracking-tight"
                                >
                                  {device.brand} {device.model}
                                </Link>
                                <span className="font-mono text-[10px] text-stone-400">
                                  SN: {device.serialNumber}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {getConditionBadge(device.condition)}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {recommendation ? (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant={
                                    recommendation.recommendedAction === 'DIY'
                                      ? 'success'
                                      : recommendation.recommendedAction === 'REPAIR'
                                      ? 'rust'
                                      : recommendation.recommendedAction === 'RESELL'
                                      ? 'warning'
                                      : 'error'
                                  }
                                  size="sm"
                                >
                                  {recommendation.recommendedAction}
                                </Badge>
                                <span className="font-mono text-[11px] text-stone-600 font-medium">
                                  {recommendation.repairabilityScore}
                                  <span className="text-stone-400 font-normal">/100</span>
                                </span>
                              </div>
                            ) : matchedRequest ? (
                              <Badge variant="outline" size="sm">
                                {matchedRequest.status}
                              </Badge>
                            ) : (
                              <span className="font-mono text-stone-400 text-[11px]">Not assessed</span>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {getWarrantyBadge(warrantyStatus)}
                          </td>

                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <Link
                              href={`/devices/${device.id}`}
                              className="text-stone-400 hover:text-stone-900 p-1 inline-flex"
                              aria-label={`View ${device.brand} ${device.model} record`}
                            >
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-stone-500" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked View */}
              <div className="sm:hidden divide-y divide-stone-200">
                {devices.slice(0, 3).map((device) => {
                  const matchedRequest = requests.find((r) => r.deviceId === device.id);
                  const recommendation = matchedRequest?.recommendation;
                  const warrantyStatus = getWarrantyStatus(device.warrantyExpiry);

                  return (
                    <div key={device.id} className="py-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-[2px] bg-stone-100 text-stone-700">
                            {getCategoryIcon(device.category)}
                          </div>
                          <div>
                            <Link
                              href={`/devices/${device.id}`}
                              className="font-semibold text-stone-900 text-xs"
                            >
                              {device.brand} {device.model}
                            </Link>
                            <div className="font-mono text-[10px] text-stone-400">
                              SN: {device.serialNumber}
                            </div>
                          </div>
                        </div>
                        {getConditionBadge(device.condition)}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        {recommendation ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                recommendation.recommendedAction === 'DIY'
                                  ? 'success'
                                  : recommendation.recommendedAction === 'REPAIR'
                                  ? 'rust'
                                  : recommendation.recommendedAction === 'RESELL'
                                  ? 'warning'
                                  : 'error'
                              }
                              size="sm"
                            >
                              {recommendation.recommendedAction}
                            </Badge>
                            <span className="font-mono text-[11px] text-stone-600">
                              {recommendation.repairabilityScore}/100
                            </span>
                          </div>
                        ) : matchedRequest ? (
                          <Badge variant="outline" size="sm">
                            {matchedRequest.status}
                          </Badge>
                        ) : (
                          <span className="font-mono text-stone-400 text-[11px]">Not assessed</span>
                        )}
                        {getWarrantyBadge(warrantyStatus)}
                        <Link
                          href={`/devices/${device.id}`}
                          className="text-stone-700 font-semibold text-[11px] underline underline-offset-2"
                        >
                          View Record →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] font-mono text-stone-500">
            <span>DATABASE LEDGER // {devices.length} UNITS</span>
            <Link
              href="/devices"
              className="text-stone-700 hover:text-stone-900 underline underline-offset-2"
            >
              + Register Device
            </Link>
          </div>
        </div>

        {/* Right Column: Active In-Flight Repair & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Active Repair Operational Section */}
          <section className="space-y-4">
            <div className="border-b border-stone-200 pb-2.5 flex items-baseline justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                  Repair Telemetry
                </h2>
                {displayJob && (
                  <span className="font-mono text-[10px] text-stone-400">
                    REF: {displayJob.id}
                  </span>
                )}
              </div>
              {displayJob ? (
                <StatusIndicator
                  status={displayJob.status === 'COMPLETED' ? 'completed' : 'in_progress'}
                  label={displayJob.status === 'COMPLETED' ? 'Completed' : displayJob.status}
                />
              ) : (
                <span className="text-[11px] font-mono text-stone-400">BENCH CLEAR</span>
              )}
            </div>

            {displayJob ? (
              <div className="space-y-3 text-xs">
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">
                    {displayJobDevice?.brand} {displayJobDevice?.model}
                  </h3>
                  <p className="text-stone-500 text-[11px]">
                    {activeJobRequest?.description || 'Component-level maintenance'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-stone-100">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-400 block">
                      Specialist
                    </span>
                    <span className="font-medium text-stone-900 truncate block">
                      {displayJob.repairer?.businessName || 'Certified Workshop'}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      ★ {displayJob.repairer?.rating || '5.0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-400 block">
                      Invoiced / Agreed
                    </span>
                    <span className="font-mono font-bold text-stone-900 text-sm tabular-nums block">
                      ₹{(displayJob.actualCost || displayJob.agreedCost).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      ✓ Passport record stamped
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-3">
                    Service Progression
                  </div>
                  <Timeline steps={buildMiniTimeline(displayJob.status)} />
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">
                    Status: {displayJob.status}
                  </span>
                  <Link
                    href="/repairs"
                    className="font-semibold text-stone-900 hover:text-orange-800 inline-flex items-center gap-1"
                  >
                    <span>Full Job Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-stone-200 rounded-[2px] text-xs text-stone-500 space-y-2">
                <p>No active repair jobs in workshop progression.</p>
                <Link href="/report">
                  <span className="text-orange-800 hover:text-orange-950 font-semibold font-mono underline">
                    Report a hardware fault →
                  </span>
                </Link>
              </div>
            )}
          </section>

          {/* Recent Chronological Activity Log */}
          <section className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                Recent Activity Log
              </h2>
              <span className="text-[10px] font-mono text-stone-400">DATABASE AUDIT</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-xs text-stone-400 italic py-2">
                No recent activity records logged.
              </div>
            ) : (
              <ol className="space-y-2.5 text-xs">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start gap-2.5 text-xs border-b border-stone-100 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-stone-900">
                          {activity.title}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400 tabular-nums">
                          {activity.timestamp}
                        </span>
                      </div>
                      <p className="text-stone-500 text-[11px] leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
