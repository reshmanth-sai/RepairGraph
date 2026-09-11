import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface AttentionBannerProps {
  title: string;
  description: string;
  meta: string;
  actionText: string;
  actionHref: string;
  className?: string;
}

export function AttentionBanner({
  title,
  description,
  meta,
  actionText,
  actionHref,
  className = ''
}: AttentionBannerProps) {
  return (
    <div
      role="region"
      aria-label="Action required notification"
      className={`border-l-2 border-l-amber-600 border border-stone-200 bg-white p-4 sm:p-5 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-amber-700 shrink-0">
          <AlertCircle className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold">
              Action Required
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-[11px] font-mono text-stone-500">{meta}</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0 sm:pl-4 sm:border-l sm:border-stone-100 flex items-center">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-[2px] hover:bg-stone-100 hover:border-stone-400 active:bg-stone-200 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
