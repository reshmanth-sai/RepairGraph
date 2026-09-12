'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { devicesApi, repairRequestsApi, ApiDevice, UrgencyLevel, ApiRepairRequest } from '@/lib/api';
import { sanitizeErrorMessage } from '@/lib/sanitizeError';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Building2,
} from 'lucide-react';

function ReportProblemContent() {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('deviceId');
  const preferredRepairerId = searchParams.get('preferredRepairer');
  const preferredRepairerName = searchParams.get('repairerName');
  const displaySpecialist = preferredRepairerName || (preferredRepairerId ? `Specialist #${preferredRepairerId.slice(-6)}` : null);

  const { user, isLoading: authLoading } = useAuth();
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<ApiRepairRequest | null>(null);

  useEffect(() => {
    async function loadDevices() {
      try {
        const data = await devicesApi.list();
        const list = Array.isArray(data) ? data : [];
        setDevices(list);
        if (list.length > 0) {
          const match = list.find((d) => d.id === preSelectedId);
          setSelectedDeviceId(match ? match.id : list[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not fetch your devices.');
      } finally {
        setDevicesLoading(false);
      }
    }

    if (user) {
      loadDevices();
    } else if (!authLoading) {
      setDevicesLoading(false);
    }
  }, [user, authLoading, preSelectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      setError('Please select a device to report a fault.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide at least 10 characters describing the observed symptoms.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await repairRequestsApi.create({
        deviceId: selectedDeviceId,
        description: description.trim(),
        urgency,
      });

      setCreatedRequest(created);
    } catch (err: unknown) {
      setError(
        sanitizeErrorMessage(
          err,
          "We couldn't complete the repair assessment. Please verify your details and try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  if (authLoading || devicesLoading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-stone-400">
        INITIALIZING FAULT REPORT PIPELINE…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-600">
          <Wrench className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">Authentication Required</h2>
          <p className="text-xs text-stone-500">
            Sign in to submit hardware failure symptoms and request specialist repair quotes.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={
              preSelectedId
                ? `/login?redirect=${encodeURIComponent(`/report?deviceId=${preSelectedId}`)}`
                : '/login?redirect=/report'
            }
          >
            <Button variant="primary">Sign In to Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">No Hardware Registered</h2>
          <p className="text-xs text-stone-500">
            You must register at least one electronic device before filing a repair request.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/devices">
            <Button variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Add Your First Device
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <PageHeader
        title="Report a Problem"
        subtitle="Submit hardware failure symptoms for technical triage, repairability verification, and specialist quotes."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Report a Problem' }
        ]}
      />

      {/* Preferred Specialist Contextual Notice */}
      {displaySpecialist && !createdRequest && (
        <div className="p-4 bg-stone-50 border border-stone-300 rounded-[2px] space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-stone-900 font-mono text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Preferred Specialist: {displaySpecialist}</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Your repair request will remain available through the specialist registry. This preference does not exclusively
            assign the request to this workshop.
          </p>
        </div>
      )}

      {/* Success State with Diagnostic Preview */}
      {createdRequest ? (
        <div
          role="status"
          aria-live="polite"
          className="border border-stone-300 bg-stone-50/70 p-6 sm:p-8 rounded-[2px] space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                Repair assessment ready
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                Diagnostic Evaluation & Repair Request Logged
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Your repair ticket has been evaluated and registered under reference{' '}
                <span className="font-mono font-bold text-stone-900">
                  REF: {createdRequest.id}
                </span>
                . Technical signals have been triaged and this record is now visible in the specialist network for competitive quotes.
              </p>
            </div>
          </div>

          {/* Concise Diagnostic Preview Card */}
          <div className="bg-white border border-stone-200 rounded-[2px] p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Target Device</span>
                <div className="text-xs font-bold text-stone-900">
                  {createdRequest.device?.brand || selectedDevice?.brand} {createdRequest.device?.model || selectedDevice?.model}
                </div>
              </div>
              {createdRequest.recommendation && (
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Recommendation</span>
                  <div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] inline-block border ${
                      createdRequest.recommendation.recommendedAction === 'REPAIR' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      createdRequest.recommendation.recommendedAction === 'DIY' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      createdRequest.recommendation.recommendedAction === 'RESELL' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      createdRequest.recommendation.recommendedAction === 'RECYCLE' ? 'bg-stone-100 text-stone-800 border-stone-300' :
                      'bg-red-50 text-red-800 border-red-300'
                    }`}>
                      {createdRequest.recommendation.recommendedAction}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-stone-50 rounded-[2px] border border-stone-100">
                <div className="text-[10px] font-mono uppercase text-stone-400">Likely Issue</div>
                <div className="text-xs font-semibold text-stone-900 mt-0.5 line-clamp-2">
                  {createdRequest.diagnosis?.possibleIssue || 'Hardware fault analyzed'}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-[2px] border border-stone-100">
                <div className="text-[10px] font-mono uppercase text-stone-400">Confidence</div>
                <div className="text-xs font-mono font-bold text-stone-900 mt-0.5">
                  {Math.round((createdRequest.diagnosis?.confidence ?? 0.8) * 100)}%
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-[2px] border border-stone-100">
                <div className="text-[10px] font-mono uppercase text-stone-400">Estimated Repair</div>
                <div className="text-xs font-mono font-semibold text-stone-900 mt-0.5">
                  {createdRequest.recommendation?.estimatedCostMin !== undefined
                    ? `₹${createdRequest.recommendation.estimatedCostMin.toLocaleString('en-IN')} – ₹${createdRequest.recommendation.estimatedCostMax.toLocaleString('en-IN')}`
                    : 'Awaiting Quote'}
                </div>
              </div>
            </div>

            {createdRequest.recommendation?.reasoning && (
              <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-stone-100">
                <strong className="text-stone-800">Triage Summary:</strong> {createdRequest.recommendation.reasoning}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/repairs">
              <Button variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Full Assessment
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setCreatedRequest(null);
                setDescription('');
              }}
            >
              File Another Request
            </Button>
          </div>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-200 rounded-[2px] flex items-center justify-between text-xs text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="min-h-[44px] px-2 text-xs font-mono font-semibold underline text-red-700 hover:text-red-900 ml-3"
                aria-label="Dismiss error notification"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. Which Device? */}
          <div className="space-y-2">
            <label htmlFor="device-select" className="block text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
              1. Select Hardware Unit
            </label>
            <select
              id="device-select"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full min-h-[44px] text-xs sm:text-sm p-3 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-stone-900 font-medium"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model} ({d.category}) — SN: {d.serialNumber}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500">
              Only devices currently registered in your authenticated catalog can be selected.
            </p>
          </div>

          {/* 2. Urgency Level */}
          <div className="space-y-2">
            <label id="urgency-label" className="block text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
              2. Urgency Level
            </label>
            <div role="radiogroup" aria-labelledby="urgency-label" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'LOW', label: 'Low', desc: 'Non-critical / intermittent' },
                  { id: 'MEDIUM', label: 'Medium', desc: 'Affects daily workflow' },
                  { id: 'HIGH', label: 'High', desc: 'Critical / device inoperable' },
                ] as const
              ).map((u, idx) => {
                const levels: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
                return (
                  <button
                    key={u.id}
                    id={`urgency-opt-${u.id}`}
                    type="button"
                    role="radio"
                    tabIndex={urgency === u.id ? 0 : -1}
                    aria-checked={urgency === u.id}
                    onClick={() => setUrgency(u.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = levels[(idx + 1) % levels.length];
                        setUrgency(next);
                        document.getElementById(`urgency-opt-${next}`)?.focus();
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = levels[(idx - 1 + levels.length) % levels.length];
                        setUrgency(prev);
                        document.getElementById(`urgency-opt-${prev}`)?.focus();
                      }
                    }}
                    className={`min-h-[44px] p-3 border rounded-[2px] text-left transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
                      urgency === u.id
                        ? 'border-stone-900 bg-stone-100/70 font-semibold ring-1 ring-stone-900'
                        : 'border-stone-300 bg-white hover:border-stone-400'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900">{u.label}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{u.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. What is wrong? Natural-language with Structured Guidance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="symptoms-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
                3. Describe Observed Symptoms
              </label>
              <span className="text-[11px] font-mono text-stone-500">Natural-language triage</span>
            </div>
            <textarea
              id="symptoms-input"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, whether the device powers on, any liquid or impact, thermal behavior, or visible damage..."
              required
              className="w-full text-xs sm:text-sm p-3 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 leading-relaxed font-sans text-stone-900"
            />

            {/* Contextual Structured Guidance */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] text-xs text-stone-600 space-y-1.5">
              <div className="font-bold text-stone-800 text-[11px] uppercase tracking-wider font-mono">
                Helpful Details to Include
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600 text-[11px] leading-relaxed">
                <li><strong>Trigger & Timeline:</strong> When did it start? What happened immediately before?</li>
                <li><strong>Power & Boot:</strong> Does the device power on, cycle, or show charging response?</li>
                <li><strong>Display & Input:</strong> Does the screen illuminate, flicker, touch respond, or stay black?</li>
                <li><strong>Hazards:</strong> Any liquid exposure, unusual heat, electrical odor, or battery swelling?</li>
              </ul>
            </div>
          </div>

          {/* 4. Action & Progress */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            {isSubmitting && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] text-xs text-stone-600 flex items-center gap-2 font-mono animate-pulse"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-orange-600"></span>
                <span>Analyzing reported symptoms • Evaluating repairability • Assessing repair economics • Preparing recommendation</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link href="/devices">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Analyzing Symptoms & Scoring…' : 'Submit Repair Request'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ReportProblemPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-mono text-xs text-stone-400">Loading...</div>}>
      <ReportProblemContent />
    </Suspense>
  );
}

