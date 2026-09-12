'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { repairersApi } from '@/lib/api';
import { ApiRepairer } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  MapPin,
  Star,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Laptop,
  Smartphone,
  Tablet,
  Headphones,
  Tv,
  FileCheck,
} from 'lucide-react';

export default function RepairerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [repairer, setRepairer] = useState<ApiRepairer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepairer = useCallback(async (repairerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repairersApi.getById(repairerId);
      setRepairer(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve specialist profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadRepairer(id);
    }
  }, [id, loadRepairer]);

  // Group specializations by deviceCategory
  const groupedSpecializations = useMemo(() => {
    if (!repairer?.specializations) return {};
    const groups: Record<string, Array<{ id: string; brand: string; serviceType: string }>> = {};
    for (const spec of repairer.specializations) {
      const cat = spec.deviceCategory;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push({
        id: spec.id,
        brand: spec.brand,
        serviceType: spec.serviceType,
      });
    }
    return groups;
  }, [repairer]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP':
        return <Laptop className="w-4 h-4 text-stone-600" aria-hidden="true" />;
      case 'SMARTPHONE':
        return <Smartphone className="w-4 h-4 text-stone-600" aria-hidden="true" />;
      case 'TABLET':
        return <Tablet className="w-4 h-4 text-stone-600" aria-hidden="true" />;
      case 'HEADPHONES':
        return <Headphones className="w-4 h-4 text-stone-600" aria-hidden="true" />;
      case 'MONITOR':
        return <Tv className="w-4 h-4 text-stone-600" aria-hidden="true" />;
      default:
        return <Wrench className="w-4 h-4 text-stone-600" aria-hidden="true" />;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-4 bg-stone-200 rounded-[2px] w-48" />
        <div className="space-y-3">
          <div className="h-8 bg-stone-200 rounded-[2px] w-96" />
          <div className="h-4 bg-stone-200 rounded-[2px] w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-stone-100 rounded-[3px] border border-stone-200" />
            <div className="h-48 bg-stone-100 rounded-[3px] border border-stone-200" />
          </div>
          <div className="h-64 bg-stone-100 rounded-[3px] border border-stone-200" />
        </div>
      </div>
    );
  }

  if (error || !repairer) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-700">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">
            Specialist Profile Not Found
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            {error || 'The requested specialist does not exist or has been removed from the registry.'}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/repairers">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Specialist Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = repairer.verificationStatus === 'VERIFIED';
  const reviews = repairer.reviews || [];
  const reviewCount = repairer._count?.reviews ?? reviews.length;
  const categories = Object.keys(groupedSpecializations);

  return (
    <div className="space-y-8">
      {/* Back Link & Navigation Breadcrumb */}
      <div>
        <Link
          href="/repairers"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-mono transition-colors focus-visible:outline-none focus-visible:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Specialists</span>
        </Link>
      </div>

      {/* Profile Header */}
      <header className="border-b border-stone-200 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              {isVerified ? (
                <Badge variant="success" size="sm" dot>
                  VERIFIED SPECIALIST
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  REGISTERED WORKSHOP
                </Badge>
              )}
              <span className="text-xs text-stone-400 font-mono">ID: {repairer.id.slice(-8)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {repairer.businessName}
            </h1>

            <div className="flex items-center gap-2 text-xs text-stone-600 font-mono">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{repairer.address}</span>
            </div>
          </div>

          {/* Quick Action Link for Mobile / Header */}
          <div className="sm:self-center">
            <Link href={`/report?preferredRepairer=${repairer.id}&repairerName=${encodeURIComponent(repairer.businessName)}`}>
              <Button variant="accent" size="md" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Request Repair Quote
              </Button>
            </Link>
          </div>
        </div>

        {/* Reputation & Performance Metrics Strip */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-stone-600">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" aria-hidden="true" />
            <span className="text-stone-900 font-bold text-sm">{repairer.rating.toFixed(1)}</span>
            <span className="text-stone-400">({reviewCount} verified reviews)</span>
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">|</span>

          <div>
            <span className="text-stone-900 font-bold">{repairer.totalJobs}</span>
            <span className="text-stone-500"> completed repairs</span>
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">|</span>

          <div>
            <span className="text-stone-500">Registry Member Since </span>
            <span className="text-stone-900 font-medium">{formatDate(repairer.createdAt)}</span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workshop Overview, Specializations, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Workshop Description */}
          <section aria-labelledby="workshop-overview-heading" className="space-y-3">
            <h2 id="workshop-overview-heading" className="text-xs font-mono uppercase tracking-widest text-stone-400 font-semibold">
              Workshop Overview
            </h2>
            <div className="bg-white border border-stone-200 rounded-[3px] p-5">
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {repairer.description ||
                  'Independent electronic service laboratory providing component-level micro-soldering, hardware diagnostics, and OEM-grade module replacement.'}
              </p>
            </div>
          </section>

          {/* Specializations & Hardware Support */}
          <section aria-labelledby="specializations-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="specializations-heading" className="text-xs font-mono uppercase tracking-widest text-stone-400 font-semibold">
                Hardware Specializations & Services
              </h2>
              <span className="text-xs font-mono text-stone-500">
                {repairer.specializations?.length || 0} registered capabilities
              </span>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-4">
                {categories.map((category) => {
                  const specs = groupedSpecializations[category];
                  return (
                    <div
                      key={category}
                      className="bg-white border border-stone-200 rounded-[3px] p-5 space-y-3"
                    >
                      <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                        {getCategoryIcon(category)}
                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
                          {category} Servicing
                        </h3>
                        <span className="text-[10px] font-mono text-stone-400 ml-auto">
                          {specs.length} capabilities
                        </span>
                      </div>

                      <div className="divide-y divide-stone-100">
                        {specs.map((spec) => (
                          <div key={spec.id} className="py-2.5 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                            <div className="font-medium text-xs text-stone-900 flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-stone-100 text-stone-800 font-mono text-[10px] rounded-[2px] border border-stone-200">
                                {spec.brand}
                              </span>
                              <span>{spec.serviceType}</span>
                            </div>
                            <div className="text-[11px] font-mono text-stone-400 shrink-0">
                              Diagnostic Verified
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-[3px] p-6 text-center space-y-2">
                <Wrench className="w-5 h-5 text-stone-400 mx-auto" aria-hidden="true" />
                <p className="text-xs text-stone-600 font-medium">
                  General Electronics Diagnostic & Repair
                </p>
                <p className="text-xs text-stone-400">
                  This specialist accepts repair requests across multiple electronic device categories.
                </p>
              </div>
            )}
          </section>

          {/* Verified Customer Reviews */}
          <section aria-labelledby="reviews-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="reviews-heading" className="text-xs font-mono uppercase tracking-widest text-stone-400 font-semibold">
                Customer Reviews
              </h2>
              <span className="text-xs font-mono text-stone-500">
                {reviews.length} published reviews
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="bg-white border border-stone-200 rounded-[3px] p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5" aria-label={`Rating: ${rev.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-stone-200'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-stone-900 font-mono">
                          {rev.rating}.0
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-stone-400">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-500">
                      <span>Reviewed by {rev.user?.name || 'Verified Customer'}</span>
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                        Verified Repair Job
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-[3px] p-8 text-center space-y-2 shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-stone-400 mx-auto" aria-hidden="true" />
                <h3 className="text-xs font-bold text-stone-900 tracking-tight">
                  No Verified Reviews Yet
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Reviews are permanently recorded on RepairGraph exclusively after a customer accepts a quote and the technician successfully completes the repair job.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Workshop Actions & Registry Sidebar */}
        <aside aria-label="Commission Workshop Actions" className="space-y-6">
          {/* Commission CTA Card */}
          <div className="bg-white border border-stone-200 rounded-[3px] p-6 space-y-5 shadow-xs sticky top-20">
            <div className="space-y-1.5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-orange-800 font-bold">
                REQUEST A QUOTE
              </h2>
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                Report Problem with Specialist Preference
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Submit your device symptoms for RepairGraph technical triage. Your repair request will be published in the registry with {repairer.businessName} noted as your preference for competitive quotes.
              </p>
            </div>

            <div className="pt-1">
              <Link
                href={`/report?preferredRepairer=${repairer.id}&repairerName=${encodeURIComponent(repairer.businessName)}`}
                className="w-full block"
              >
                <Button variant="accent" size="lg" className="w-full justify-between">
                  <span>Request Quote with this Specialist</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Direct competitive quotes submitted to your Repairs workspace</span>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Automatic permanent Repair Passport record upon handover</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Request remains open in registry to compare competitive quotes</span>
              </div>
            </div>

            {/* Registry Info Box */}
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-[2px] space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">STATUS</span>
                <span className="text-stone-800 font-semibold">{repairer.verificationStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">RATING</span>
                <span className="text-stone-800 font-semibold">{repairer.rating.toFixed(1)} / 5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">TOTAL JOBS</span>
                <span className="text-stone-800 font-semibold">{repairer.totalJobs}</span>
              </div>
              {repairer.latitude && repairer.longitude && (
                <div className="flex justify-between pt-1 border-t border-stone-200/60">
                  <span className="text-stone-400">COORDINATES</span>
                  <span className="text-stone-600">
                    {repairer.latitude.toFixed(3)}, {repairer.longitude.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
