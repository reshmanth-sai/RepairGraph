'use client';

import React, { useState, useEffect } from 'react';
import { ApiRepairRequest } from '@/lib/api/types';
import { repairRequestsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, AlertCircle } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairRequest: ApiRepairRequest;
  onQuoteSubmitted: () => void;
}

export function QuoteModal({
  isOpen,
  onClose,
  repairRequest,
  onQuoteSubmitted,
}: QuoteModalProps) {
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [estimatedDays, setEstimatedDays] = useState<string>('2');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill reasonable defaults based on RepairGraph engine recommendation if available
  useEffect(() => {
    if (isOpen && repairRequest) {
      if (repairRequest.recommendation) {
        const midCost = Math.round(
          (repairRequest.recommendation.estimatedCostMin +
            repairRequest.recommendation.estimatedCostMax) /
            2
        );
        setEstimatedCost(midCost.toString());
      } else {
        setEstimatedCost('');
      }
      setEstimatedDays('2');
      setNotes('');
      setError(null);
    }
  }, [isOpen, repairRequest]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const costNum = parseFloat(estimatedCost);
    const daysNum = parseInt(estimatedDays, 10);

    if (isNaN(costNum) || costNum <= 0) {
      setError('Please provide a valid estimated cost greater than zero.');
      return;
    }

    if (isNaN(daysNum) || daysNum < 1) {
      setError('Turnaround time must be at least 1 full operating day.');
      return;
    }

    if (notes.length > 1000) {
      setError('Technical notes must not exceed 1000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await repairRequestsApi.submitQuote(repairRequest.id, {
        estimatedCost: costNum,
        estimatedDays: daysNum,
        notes: notes.trim() || undefined,
      });

      onQuoteSubmitted();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to submit quote. The request may no longer be quotable.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white border border-stone-300 rounded-[3px] shadow-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                Commercial Quote
              </span>
              <Badge variant="neutral" size="sm">
                TICKET #{repairRequest.id.slice(-6)}
              </Badge>
            </div>
            <h2 id="quote-modal-title" className="text-sm font-bold text-stone-900 tracking-tight">
              Submit Repair Quote
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-stone-900"
            aria-label="Close quote modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Request Summary */}
        <div className="px-5 py-3 bg-stone-100/50 border-b border-stone-200 text-xs font-mono space-y-1">
          <div className="flex justify-between text-stone-700 font-semibold">
            <span>
              {repairRequest.device?.brand} {repairRequest.device?.model}
            </span>
            <span className="text-stone-500 capitalize">
              {repairRequest.device?.category?.toLowerCase()}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-sans line-clamp-2 italic">
            &ldquo;{repairRequest.description}&rdquo;
          </p>
          {repairRequest.recommendation && (
            <div className="pt-1 flex items-center gap-2 text-[10px] text-stone-600">
              <span className="text-stone-400">BENCHMARK ESTIMATE:</span>
              <span className="font-bold text-stone-800">
                ₹{repairRequest.recommendation.estimatedCostMin.toLocaleString('en-IN')} – ₹
                {repairRequest.recommendation.estimatedCostMax.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Estimated Cost */}
            <div className="space-y-1">
              <label
                htmlFor="quote-cost"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700"
              >
                Estimated Cost (₹) <span className="text-red-600">*</span>
              </label>
              <input
                id="quote-cost"
                type="number"
                step="50"
                min="100"
                required
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400 font-mono">
                Total all-inclusive parts & labor fee
              </span>
            </div>

            {/* Turnaround Days */}
            <div className="space-y-1">
              <label
                htmlFor="quote-days"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700"
              >
                Turnaround (Days) <span className="text-red-600">*</span>
              </label>
              <input
                id="quote-days"
                type="number"
                step="1"
                min="1"
                max="60"
                required
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="e.g. 3"
                className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400 font-mono">
                Expected days to complete servicing
              </span>
            </div>
          </div>

          {/* Technical Notes */}
          <div className="space-y-1">
            <label
              htmlFor="quote-notes"
              className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700"
            >
              Technician Diagnosis & Work Plan <span className="text-stone-400 text-[10px] font-normal">(Optional)</span>
            </label>
            <textarea
              id="quote-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes OEM display module replacement, internal dust cleaning, and 90-day testing warranty on digitizer flex cable."
              maxLength={1000}
              className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-[2px] focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-stone-900 leading-relaxed"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>Customer will review this plan before accepting</span>
              <span>{notes.length} / 1000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-100">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Transmitting Quote…' : 'Submit Official Quote'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
