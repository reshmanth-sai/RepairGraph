import React from 'react';
import Link from 'next/link';
import { ApiRepairer } from '@/lib/api/types';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Star, ArrowRight } from 'lucide-react';

interface RepairerCardProps {
  repairer: ApiRepairer;
  targetCategory?: string;
  targetBrand?: string;
  className?: string;
}

export function RepairerCard({
  repairer,
  targetCategory,
  targetBrand,
  className = '',
}: RepairerCardProps) {
  const isVerified = repairer.verificationStatus === 'VERIFIED';
  const reviewCount = repairer._count?.reviews ?? 0;
  const specializations = repairer.specializations || [];
  const displaySpecs = specializations.slice(0, 3);
  const remainingSpecsCount = specializations.length - displaySpecs.length;

  // Compute truthful specialization match if a category/brand target is specified
  let matchStatus: { type: 'FULL' | 'PARTIAL' | 'UNCONFIRMED'; label: string; desc: string } | null = null;
  if (targetCategory && targetCategory !== 'ALL') {
    const hasCategory = specializations.some(
      (s) => s.deviceCategory.toUpperCase() === targetCategory.toUpperCase()
    );
    const hasBrand =
      targetBrand && targetBrand !== 'ALL'
        ? specializations.some(
            (s) =>
              s.deviceCategory.toUpperCase() === targetCategory.toUpperCase() &&
              s.brand.toLowerCase() === targetBrand.toLowerCase()
          )
        : false;

    if (hasBrand) {
      matchStatus = {
        type: 'FULL',
        label: 'MATCH',
        desc: `Specializes in ${targetCategory.toLowerCase()}s and ${targetBrand}`,
      };
    } else if (hasCategory) {
      matchStatus = {
        type: targetBrand && targetBrand !== 'ALL' ? 'PARTIAL' : 'FULL',
        label: targetBrand && targetBrand !== 'ALL' ? 'PARTIAL MATCH' : 'MATCH',
        desc:
          targetBrand && targetBrand !== 'ALL'
            ? `Supports ${targetCategory.toLowerCase()}s; brand specialization not confirmed`
            : `Specializes in ${targetCategory.toLowerCase()}s`,
      };
    } else {
      matchStatus = {
        type: 'UNCONFIRMED',
        label: 'SPECIALIZATION NOT CONFIRMED',
        desc: `No registered specialization for ${targetCategory.toLowerCase()}s`,
      };
    }
  }

  return (
    <article
      className={`group relative bg-white border border-stone-200 hover:border-stone-400 rounded-[3px] p-5 flex flex-col justify-between transition-colors shadow-2xs hover:shadow-xs focus-within:border-stone-900 ${className}`}
    >
      <div className="space-y-3.5">
        {/* Top Header: Business Name + Verification Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-bold text-stone-900 tracking-tight group-hover:text-orange-950 transition-colors truncate">
              <Link
                href={`/repairers/${repairer.id}`}
                className="focus-visible:outline-none focus-visible:underline decoration-stone-400 underline-offset-2"
              >
                {repairer.businessName}
              </Link>
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" aria-hidden="true" />
              <span className="truncate">{repairer.address}</span>
            </div>
          </div>

          <div className="shrink-0">
            {isVerified ? (
              <Badge variant="success" size="sm" dot>
                VERIFIED
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                PENDING
              </Badge>
            )}
          </div>
        </div>

        {/* Workshop Description if provided */}
        {repairer.description && (
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {repairer.description}
          </p>
        )}

        {/* Metrics Row: Rating + Reviews + Completed Jobs */}
        <div className="flex items-center gap-3 pt-1 border-t border-stone-100 text-xs font-mono">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" aria-hidden="true" />
            <span className="font-bold text-stone-900">{repairer.rating.toFixed(1)}</span>
            <span className="text-stone-400 text-[11px]">({reviewCount})</span>
          </div>

          <span className="text-stone-300" aria-hidden="true">•</span>

          <div className="text-stone-600 text-[11px]">
            <span className="font-semibold text-stone-800">{repairer.totalJobs}</span> completed
          </div>
        </div>

        {/* Compatibility Match Status Banner if target category/brand specified */}
        {matchStatus && (
          <div
            className={`p-2.5 rounded-[2px] border text-[11px] font-mono flex flex-col gap-0.5 ${
              matchStatus.type === 'FULL'
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : matchStatus.type === 'PARTIAL'
                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                : 'bg-stone-50 border-stone-200 text-stone-600'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  matchStatus.type === 'FULL'
                    ? 'bg-emerald-600'
                    : matchStatus.type === 'PARTIAL'
                    ? 'bg-amber-600'
                    : 'bg-stone-400'
                }`}
              />
              <span>{matchStatus.label}</span>
            </div>
            <p className="text-[11px] leading-tight font-sans text-stone-700">
              {matchStatus.desc}
            </p>
          </div>
        )}

        {/* Specializations Tags */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
            Specializations
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displaySpecs.length > 0 ? (
              <>
                {displaySpecs.map((spec) => (
                  <span
                    key={spec.id}
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-stone-100/90 text-stone-700 rounded-[2px] border border-stone-200/80"
                  >
                    {spec.brand} {spec.deviceCategory.toLowerCase()}
                  </span>
                ))}
                {remainingSpecsCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-stone-400 bg-stone-50 rounded-[2px] border border-stone-200/60">
                    +{remainingSpecsCount} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-stone-400 font-mono italic">
                General Diagnostic & Repair
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Link */}
      <div className="pt-2 mt-3 border-t border-stone-100 flex items-center justify-between">
        <Link
          href={`/repairers/${repairer.id}`}
          className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 group-hover:text-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-[2px] touch-manipulation py-2"
          aria-label={`View full profile of ${repairer.businessName}`}
        >
          <span>View Specialist Profile</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform text-stone-400 group-hover:text-orange-700" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
