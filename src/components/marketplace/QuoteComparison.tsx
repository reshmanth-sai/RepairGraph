'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ApiQuote } from '@/lib/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFocusTrap } from '@/lib/useFocusTrap';
import {
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  TrendingDown,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface QuoteComparisonProps {
  quotes: ApiQuote[];
  isCustomer: boolean;
  isActionLoading: boolean;
  onAcceptQuote: (quote: ApiQuote) => Promise<void>;
  onDeclineQuote: (quote: ApiQuote) => Promise<void>;
}

export function QuoteComparison({
  quotes,
  isCustomer,
  isActionLoading,
  onAcceptQuote,
  onDeclineQuote,
}: QuoteComparisonProps) {
  const [confirmAcceptQuote, setConfirmAcceptQuote] = useState<ApiQuote | null>(null);
  const [confirmDeclineQuote, setConfirmDeclineQuote] = useState<ApiQuote | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeAcceptModal = () => {
    setConfirmAcceptQuote(null);
  };

  const closeDeclineModal = () => {
    setConfirmDeclineQuote(null);
  };

  const acceptTrapRef = useFocusTrap({
    isOpen: !!confirmAcceptQuote,
    onClose: closeAcceptModal,
    disableFocusTrap: isActionLoading,
  });

  const declineTrapRef = useFocusTrap({
    isOpen: !!confirmDeclineQuote,
    onClose: closeDeclineModal,
    disableFocusTrap: isActionLoading,
  });

  const openAcceptModal = (quote: ApiQuote) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setConfirmAcceptQuote(quote);
  };

  const openDeclineModal = (quote: ApiQuote) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setConfirmDeclineQuote(quote);
  };

  if (quotes.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-stone-300 rounded-[3px] bg-stone-50/50 space-y-3">
        <div className="w-8 h-8 rounded-full bg-stone-200/70 flex items-center justify-center mx-auto text-stone-600">
          <Clock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-stone-900 uppercase font-mono tracking-wider">
            Awaiting Specialist Quotes
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            No workshop quotes have been submitted yet. Verified specialists in the registry are reviewing your technical symptoms.
          </p>
        </div>
        <div className="pt-1">
          <Link href="/repairers">
            <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Browse Verified Specialists
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate truthful distinctions strictly from pending quotes data
  const pendingQuotes = quotes.filter((q) => q.status === 'PENDING');
  const minPrice =
    pendingQuotes.length > 1
      ? Math.min(...pendingQuotes.map((q) => q.estimatedCost))
      : null;
  const minDays =
    pendingQuotes.length > 1
      ? Math.min(...pendingQuotes.map((q) => q.estimatedDays))
      : null;
  const maxRating =
    pendingQuotes.length > 1
      ? Math.max(...pendingQuotes.map((q) => q.repairer.rating))
      : null;

  return (
    <div className="space-y-4">
      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((quote) => {
          const isPending = quote.status === 'PENDING';
          const isAccepted = quote.status === 'ACCEPTED';
          const isRejected = quote.status === 'REJECTED';
          const isWithdrawn = quote.status === 'WITHDRAWN';

          const isLowestPrice = isPending && minPrice !== null && quote.estimatedCost === minPrice;
          const isFastestTurnaround = isPending && minDays !== null && quote.estimatedDays === minDays;
          const isHighestRating =
            isPending && maxRating !== null && maxRating > 0 && quote.repairer.rating === maxRating;

          return (
            <div
              key={quote.id}
              className={`bg-white border rounded-[3px] p-4 sm:p-5 flex flex-col justify-between transition-colors space-y-4 shadow-2xs ${
                isAccepted
                  ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20'
                  : isRejected || isWithdrawn
                  ? 'border-stone-200 opacity-60 bg-stone-50/40'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header: Specialist Name & Verification */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/repairers/${quote.repairer.id}`}
                      className="font-bold text-stone-900 text-sm hover:text-orange-950 transition-colors block truncate break-words"
                    >
                      {quote.repairer.businessName}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate break-words">{quote.repairer.address}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {quote.repairer.verificationStatus === 'VERIFIED' ? (
                      <Badge variant="success" size="sm" dot>
                        VERIFIED
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        REGISTERED
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Calculated Distinctions (if multiple quotes and genuinely earned) */}
                {(isLowestPrice || isFastestTurnaround || isHighestRating) && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {isLowestPrice && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[2px]">
                        <TrendingDown className="w-3 h-3 text-emerald-600" />
                        Lowest quoted price
                      </span>
                    )}
                    {isFastestTurnaround && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-[2px]">
                        <Zap className="w-3 h-3 text-blue-600" />
                        Fastest turnaround
                      </span>
                    )}
                    {isHighestRating && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-[2px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        Highest-rated
                      </span>
                    )}
                  </div>
                )}

                {/* Pricing & Turnaround Block */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                      Quoted Total
                    </span>
                    <span className="font-mono text-xl font-bold text-stone-900 tabular-nums">
                      ₹{quote.estimatedCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-600 pt-1 border-t border-stone-200/60 font-mono">
                    <span className="text-[11px] text-stone-400">Turnaround</span>
                    <span className="font-semibold text-stone-800">
                      {quote.estimatedDays} business {quote.estimatedDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>

                {/* Specialist Track Record */}
                <div className="flex items-center justify-between text-xs font-mono text-stone-600 px-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="font-bold text-stone-900">{quote.repairer.rating.toFixed(1)}</span>
                    <span className="text-stone-400 text-[11px]">/ 5.0</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-800">{quote.repairer.totalJobs}</span> completed repairs
                  </div>
                </div>

                {/* Scope & Notes */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
                    Scope of Work & Notes
                  </span>
                  <p className="text-xs text-stone-700 bg-stone-50/70 p-2.5 rounded-[2px] border border-stone-200 font-sans leading-relaxed line-clamp-3 break-words">
                    {quote.notes || 'Standard hardware diagnostic, component service, and bench testing.'}
                  </p>
                </div>

                {/* Warranty & Terms Disclosure */}
                <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 pt-0.5">
                  <ShieldCheck className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>Warranty: Specified in workshop notes</span>
                </div>
              </div>

              {/* Status / Decision Actions */}
              <div className="pt-3 border-t border-stone-100">
                {isPending ? (
                  isCustomer ? (
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        className="w-full justify-center min-h-[44px]"
                        disabled={isActionLoading}
                        onClick={() => openAcceptModal(quote)}
                      >
                        Choose Quote
                      </Button>
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => openDeclineModal(quote)}
                        className="w-full min-h-[44px] flex items-center justify-center text-center text-[11px] font-mono text-stone-500 hover:text-red-700 transition-colors py-2 px-3 focus:outline-none focus:underline"
                      >
                        Decline this quote
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2.5 text-xs font-mono text-stone-500 bg-stone-100 rounded-[2px]">
                      Awaiting Customer Decision
                    </div>
                  )
                ) : isAccepted ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 border border-emerald-200 rounded-[2px] text-xs font-mono font-bold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Accepted by Customer</span>
                  </div>
                ) : isRejected ? (
                  <div className="text-center py-2 text-xs font-mono text-stone-400 bg-stone-100 rounded-[2px]">
                    Declined
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs font-mono text-stone-400 bg-stone-100 rounded-[2px]">
                    Withdrawn
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal: Accept Quote */}
      {confirmAcceptQuote && (
        <div
          ref={acceptTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="accept-quote-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isActionLoading && closeAcceptModal()}
        >
          <div
            className="bg-white border border-stone-300 rounded-[3px] shadow-xl max-w-md w-full p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                  Confirmation Required
                </span>
                <h3 id="accept-quote-title" className="text-sm font-bold text-stone-900 tracking-tight">
                  Accept Repair Quote
                </h3>
              </div>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={closeAcceptModal}
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Quote Summary */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-[2px] space-y-2 text-xs font-mono">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-stone-500 uppercase text-[10px] shrink-0">Specialist</span>
                <span className="font-bold text-stone-900 truncate break-words text-right">{confirmAcceptQuote.repairer.businessName}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-stone-500 uppercase text-[10px]">Quoted Repair</span>
                <span className="font-bold text-stone-900 text-sm">
                  ₹{confirmAcceptQuote.estimatedCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-stone-500 uppercase text-[10px]">Estimated Turnaround</span>
                <span className="font-semibold text-stone-800">
                  {confirmAcceptQuote.estimatedDays} business days
                </span>
              </div>
            </div>

            {/* What happens next explainer */}
            <div className="space-y-2 text-xs text-stone-600">
              <div className="font-bold text-stone-900 font-mono text-[11px] uppercase tracking-wider">
                What happens next
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-stone-600">
                <li>The active repair job will be created in the system.</li>
                <li>The specialist will begin intake diagnostics on the workshop bench.</li>
                <li>Live repair progress will be tracked in your Repairs workspace.</li>
                <li>Final cost may depend on physical hardware inspection where applicable.</li>
              </ol>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isActionLoading}
                onClick={closeAcceptModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isActionLoading}
                onClick={async () => {
                  const target = confirmAcceptQuote;
                  setConfirmAcceptQuote(null);
                  await onAcceptQuote(target);
                }}
              >
                {isActionLoading ? 'Confirming…' : 'Confirm Quote & Begin Repair'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Decline Quote */}
      {confirmDeclineQuote && (
        <div
          ref={declineTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="decline-quote-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isActionLoading && closeDeclineModal()}
        >
          <div
            className="bg-white border border-stone-300 rounded-[3px] shadow-xl max-w-md w-full p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                  Quote Decision
                </span>
                <h3 id="decline-quote-title" className="text-sm font-bold text-stone-900 tracking-tight">
                  Decline this quote?
                </h3>
              </div>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={closeDeclineModal}
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <p className="leading-relaxed">
                Decline the quote of{' '}
                <strong className="text-stone-900 font-mono">
                  ₹{confirmDeclineQuote.estimatedCost.toLocaleString('en-IN')}
                </strong>{' '}
                from <strong className="text-stone-900 break-words">{confirmDeclineQuote.repairer.businessName}</strong>?
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                You can continue comparing other specialist bids for this repair ticket. This action marks the quote as declined.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isActionLoading}
                onClick={closeDeclineModal}
              >
                Keep Quote
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isActionLoading}
                onClick={async () => {
                  const target = confirmDeclineQuote;
                  setConfirmDeclineQuote(null);
                  await onDeclineQuote(target);
                }}
              >
                {isActionLoading ? 'Declining…' : 'Decline Quote'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
