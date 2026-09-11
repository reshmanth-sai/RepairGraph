'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { devicesApi, repairRequestsApi, ApiDevice, UrgencyLevel } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';

function ReportProblemContent() {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('deviceId');

  const { user, isLoading: authLoading } = useAuth();
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

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

      setCreatedRequestId(created.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit repair request.');
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
          <Link href="/login">
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

      {/* Success State */}
      {createdRequestId ? (
        <div className="border border-emerald-300 bg-emerald-50/40 p-6 rounded-[2px] space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-950 tracking-tight">
                Repair Request Successfully Logged
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your repair ticket has been registered in the database under reference{' '}
                <span className="font-mono font-bold text-emerald-950">
                  REF: {createdRequestId}
                </span>
                . It is now set to status <strong className="font-mono">REQUESTED</strong> and is visible to verified repair technicians for quotes.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 border border-emerald-200 rounded-[2px] text-xs text-stone-700 space-y-1 font-mono">
            <div><strong>Device:</strong> {selectedDevice?.brand} {selectedDevice?.model} (SN: {selectedDevice?.serialNumber})</div>
            <div><strong>Urgency:</strong> {urgency}</div>
            <div><strong>Status:</strong> REQUESTED (Awaiting Diagnostic Review & Quotes)</div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/repairs">
              <Button variant="primary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                View in Repairs Dashboard
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setCreatedRequestId(null);
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] flex items-center gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
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
              className="w-full text-xs sm:text-sm p-3 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-stone-900 font-medium"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model} (SN: {d.serialNumber} • Category: {d.category})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500">
              Only devices currently registered in your authenticated catalog can be selected.
            </p>
          </div>

          {/* 2. Urgency Level */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
              2. Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'LOW', label: 'Low', desc: 'Non-critical / intermittent' },
                  { id: 'MEDIUM', label: 'Medium', desc: 'Affects daily workflow' },
                  { id: 'HIGH', label: 'High', desc: 'Critical / device inoperable' },
                ] as const
              ).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUrgency(u.id)}
                  className={`p-3 border rounded-[2px] text-left transition-colors ${
                    urgency === u.id
                      ? 'border-stone-900 bg-stone-100/70'
                      : 'border-stone-300 bg-white hover:border-stone-400'
                  }`}
                >
                  <div className="text-xs font-bold text-stone-900">{u.label}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{u.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. What is wrong? */}
          <div className="space-y-2">
            <label htmlFor="symptoms-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700 font-mono">
              3. Describe Observed Symptoms
            </label>
            <textarea
              id="symptoms-input"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail symptoms, error sounds, thermal behavior, crash conditions, or visible defects..."
              required
              className="w-full text-xs sm:text-sm p-3 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 leading-relaxed font-sans text-stone-900"
            />
            <p className="text-[11px] text-stone-500">
              Minimum 10 characters. Technical specifics help verified repairers submit accurate quotes.
            </p>
          </div>

          {/* 4. Action */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
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
              {isSubmitting ? 'Logging Request…' : 'Submit Repair Request'}
            </Button>
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
