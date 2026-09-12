'use client';

import React, { useState } from 'react';
import { ApiRepairJob, JobStatus } from '@/lib/api/types';
import { repairJobsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Check,
  Clock,
  Wrench,
  AlertTriangle,
  Package,
  Cpu,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface JobStatusStepperProps {
  job: ApiRepairJob;
  onStatusUpdated: () => void;
  className?: string;
}

const ORDERED_STAGES: Array<{ status: JobStatus; label: string; icon: React.ElementType }> = [
  { status: 'ACCEPTED', label: 'Accepted', icon: Clock },
  { status: 'DIAGNOSING', label: 'Diagnosing', icon: Cpu },
  { status: 'WAITING_FOR_PART', label: 'Parts', icon: Package },
  { status: 'REPAIRING', label: 'Repairing', icon: Wrench },
  { status: 'TESTING', label: 'Testing', icon: CheckCircle2 },
  { status: 'COMPLETED', label: 'Completed', icon: ShieldCheck },
];

export function JobStatusStepper({
  job,
  onStatusUpdated,
  className = '',
}: JobStatusStepperProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completion modal/input state
  const [isCompleting, setIsCompleting] = useState(false);
  const [actualCost, setActualCost] = useState<string>(job.agreedCost.toString());
  const [completionNotes, setCompletionNotes] = useState<string>(
    job.notes || 'Hardware service finalized, calibrated, and bench-tested.'
  );

  const currentStageIndex = ORDERED_STAGES.findIndex((s) => s.status === job.status);
  const isTerminal = job.status === 'COMPLETED' || job.status === 'CANCELLED';

  const handleAdvance = async (nextStatus: JobStatus, customActualCost?: number, customNotes?: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await repairJobsApi.updateStatus(job.id, {
        status: nextStatus,
        actualCost: customActualCost,
        notes: customNotes,
      });
      setIsCompleting(false);
      onStatusUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to advance job status.';
      setError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseFloat(actualCost);
    if (isNaN(costNum) || costNum < 0) {
      setError('Please provide a valid non-negative cost.');
      return;
    }
    handleAdvance('COMPLETED', costNum, completionNotes.trim() || undefined);
  };

  return (
    <div className={`bg-white border border-stone-200 rounded-[3px] p-5 space-y-5 ${className}`}>
      {/* Top Header: Current Status Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="space-y-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
            Operational Lifecycle
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-mono">Current Stage:</span>
            <span className="text-xs font-bold text-stone-950 font-mono">
              {job.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div>
          {job.status === 'COMPLETED' && (
            <Badge variant="success" size="sm" dot>
              VERIFIED COMPLETED
            </Badge>
          )}
          {job.status === 'CANCELLED' && (
            <Badge variant="error" size="sm">
              TERMINATED
            </Badge>
          )}
          {!isTerminal && (
            <Badge variant="rust" size="sm" dot>
              ACTIVE BENCH
            </Badge>
          )}
        </div>
      </div>

      {/* Visual Stepper Progression */}
      {job.status !== 'CANCELLED' ? (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2" aria-label="Progress Stepper">
          {ORDERED_STAGES.map((stage, idx) => {
            const isDone = currentStageIndex > idx || job.status === 'COMPLETED';
            const isCurrent = job.status === stage.status;
            const Icon = stage.icon;

            return (
              <div
                key={stage.status}
                className={`p-2.5 rounded-[2px] border text-left flex flex-col justify-between transition-colors ${
                  isCurrent
                    ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-200'
                    : isDone
                    ? 'bg-stone-50 border-stone-200'
                    : 'bg-white border-stone-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-stone-400">0{idx + 1}</span>
                  {isDone && !isCurrent ? (
                    <Check className="w-3 h-3 text-stone-700 stroke-[2.5]" aria-hidden="true" />
                  ) : isCurrent ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                  ) : null}
                </div>
                <div className="mt-2 space-y-0.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isCurrent
                        ? 'text-orange-700'
                        : isDone
                        ? 'text-stone-700'
                        : 'text-stone-400'
                    }`}
                    aria-hidden="true"
                  />
                  <div
                    className={`text-[11px] font-mono leading-tight ${
                      isCurrent
                        ? 'font-bold text-stone-900'
                        : isDone
                        ? 'font-medium text-stone-700'
                        : 'text-stone-400'
                    }`}
                  >
                    {stage.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] flex items-center gap-2 text-xs text-red-800">
          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>This repair job was cancelled and is no longer actionable on the bench.</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] flex items-start gap-2 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Next Lifecycle Actions */}
      {!isTerminal && (
        <div className="space-y-3 pt-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
            Available Technician Actions
          </div>

          {/* If completing form is active */}
          {isCompleting ? (
            <form
              onSubmit={handleCompleteSubmit}
              className="p-4 bg-stone-50 border border-stone-300 rounded-[3px] space-y-3.5 animate-in fade-in duration-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Finalize Repair & Inscribe Passport</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompleting(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs font-mono"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="final-cost" className="block text-xs font-mono text-stone-700 font-bold">
                    Actual Final Cost (₹)
                  </label>
                  <input
                    id="final-cost"
                    type="number"
                    step="50"
                    min="0"
                    required
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-stone-300 rounded-[2px] font-mono"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">
                    Agreed: ₹{job.agreedCost.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1">
                  <label htmlFor="final-notes" className="block text-xs font-mono text-stone-700 font-bold">
                    Servicing & Testing Log
                  </label>
                  <textarea
                    id="final-notes"
                    rows={2}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-stone-300 rounded-[2px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => setIsCompleting(false)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Finalizing Record…' : 'Confirm & Complete'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              {job.status === 'ACCEPTED' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleAdvance('DIAGNOSING')}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Begin Physical Diagnostics
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => {
                      if (window.confirm('Terminate this repair job?')) {
                        handleAdvance('CANCELLED');
                      }
                    }}
                  >
                    Cancel Job
                  </Button>
                </>
              )}

              {job.status === 'DIAGNOSING' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleAdvance('WAITING_FOR_PART')}
                    icon={<Package className="w-3.5 h-3.5 text-stone-600" />}
                  >
                    Mark Waiting for Parts
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleAdvance('REPAIRING')}
                    icon={<Wrench className="w-3.5 h-3.5" />}
                  >
                    Start Hardware Repair
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => {
                      if (window.confirm('Terminate this repair job?')) {
                        handleAdvance('CANCELLED');
                      }
                    }}
                  >
                    Cancel Job
                  </Button>
                </>
              )}

              {job.status === 'WAITING_FOR_PART' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleAdvance('REPAIRING')}
                    icon={<Wrench className="w-3.5 h-3.5" />}
                  >
                    Parts Received: Start Repair
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => {
                      if (window.confirm('Terminate this repair job?')) {
                        handleAdvance('CANCELLED');
                      }
                    }}
                  >
                    Cancel Job
                  </Button>
                </>
              )}

              {job.status === 'REPAIRING' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleAdvance('TESTING')}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Move to Quality Testing
                </Button>
              )}

              {job.status === 'TESTING' && (
                <>
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => setIsCompleting(true)}
                    icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  >
                    Finalize & Inscribe Passport
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => handleAdvance('REPAIRING')}
                    icon={<RotateCcw className="w-3 h-3 text-stone-500" />}
                  >
                    Return to Bench (Repairing)
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Terminal State Notices */}
      {job.status === 'COMPLETED' && (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] text-xs font-mono space-y-1">
          <div className="flex justify-between text-stone-800">
            <span className="text-stone-500">FINAL COST:</span>
            <span className="font-bold">₹{(job.actualCost ?? job.agreedCost).toLocaleString('en-IN')}</span>
          </div>
          {job.completedAt && (
            <div className="flex justify-between text-stone-800">
              <span className="text-stone-500">COMPLETED DATE:</span>
              <span>{new Date(job.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          {job.notes && (
            <p className="text-[11px] text-stone-600 font-sans italic pt-1 border-t border-stone-200/60">
              &ldquo;{job.notes}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
