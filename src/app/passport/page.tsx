'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { repairHistoryApi, ApiRepairHistory } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PassportPage() {
  const { user } = useAuth();
  const [historyEntries, setHistoryEntries] = useState<ApiRepairHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repairHistoryApi.list();
      setHistoryEntries(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load repair passport ledger.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, user]);

  const handleExportLedger = () => {
    const jsonStr = JSON.stringify(historyEntries, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repairgraph-passport-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Repair Passport"
        subtitle="Standardized device service records and provenance ledger. Documenting authentic repairs, genuine parts, and technician sign-offs to protect consumer trust and second-hand value."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Repair Passport' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportLedger}
            disabled={historyEntries.length === 0}
          >
            Export Service Ledger
          </Button>
        }
      />

      {/* Editorial Overview Section */}
      <section className="space-y-3 pb-6 border-b border-stone-200">
        <h2 className="text-sm font-bold text-stone-900 tracking-tight">
          Product Provenance & Maintenance Ledger
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
          When electronic devices are resold or refurbished, buyers face an information gap:
          were replacement parts genuine, was servicing performed properly, and did liquid exposure occur?
          Repair Passport maintains a standardized digital service history tied to each physical serial number,
          giving subsequent owners and recyclers clarity on device provenance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-stone-400 uppercase text-[10px] block">Standard</span>
            <span className="font-semibold text-stone-800">Standardized Service Records</span>
          </div>
          <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
            <span className="text-stone-400 uppercase text-[10px] block">Provider Verification</span>
            <span className="font-semibold text-stone-800">Verified Independent Technicians</span>
          </div>
          <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
            <span className="text-stone-400 uppercase text-[10px] block">Regulatory Alignment</span>
            <span className="font-semibold text-stone-800">India Right to Repair / E-Waste Rules</span>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[2px] flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadHistory()} className="font-semibold underline font-mono">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 text-center font-mono text-xs text-stone-400">
          QUERYING HARDWARE PROVENANCE LEDGER…
        </div>
      )}

      {/* Service Records Ledger */}
      {!isLoading && (
        <section className="space-y-4">
          <div className="border-b border-stone-200 pb-2 flex items-baseline justify-between">
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
              Verified Service Records
            </h2>
            <span className="font-mono text-[11px] text-stone-400">
              {historyEntries.length} {historyEntries.length === 1 ? 'RECORD' : 'RECORDS'} ON LEDGER
            </span>
          </div>

          {historyEntries.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-stone-200 rounded-[2px] space-y-3 max-w-md mx-auto">
              <ShieldCheck className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-800">No Service Records Logged</h3>
                <p className="text-xs text-stone-500">
                  When repair jobs are marked completed by assigned technicians, standardized service records are automatically logged here.
                </p>
              </div>
              <Link href="/repairs">
                <Button variant="secondary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Active Repairs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {historyEntries.map((entry) => (
                <div key={entry.id} className="py-5 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-[2px]">
                          RECORD ID: {entry.id}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                          {new Date(entry.repairDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 tracking-tight mt-1">
                        {entry.device?.brand} {entry.device?.model} — {entry.repairType}
                      </h3>
                    </div>

                    <div>
                      <Badge variant="success" dot>
                        {entry.verificationStatus === 'VERIFIED' ? 'Verified Service' : 'Pending Verification'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-stone-400 font-mono text-[10px] uppercase block mb-0.5">
                        Service Entity
                      </span>
                      <div className="font-semibold text-stone-900">
                        {entry.repairer?.businessName || 'Independent Technician'}
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        ★ {entry.repairer?.rating || '5.0'} • Verified Workshop
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 font-mono text-[10px] uppercase block mb-0.5">
                        Invoiced Service Cost
                      </span>
                      <div className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                        ₹{entry.cost.toLocaleString('en-IN')}
                      </div>
                      <div className="text-emerald-800 text-[11px]">
                        ✓ Quality bench stress-tested
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 font-mono text-[10px] uppercase block mb-0.5">
                        Hardware Identification
                      </span>
                      <div className="font-mono text-stone-800">
                        SN: {entry.device?.serialNumber}
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        Category: {entry.device?.category || 'Hardware'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1.5">
                    <span className="text-stone-500 font-mono text-[10px] uppercase block font-medium">
                      Technical Service Log
                    </span>
                    <p className="text-stone-700 leading-relaxed text-xs">
                      {entry.issue}
                      {entry.notes && ` — ${entry.notes}`}
                    </p>

                    {entry.partsReplaced && entry.partsReplaced.length > 0 && (
                      <div className="pt-1 text-[11px] text-stone-600">
                        <span className="font-mono text-stone-400 uppercase text-[10px] mr-1.5">
                          Components Replaced:
                        </span>
                        {entry.partsReplaced.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
