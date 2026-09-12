'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { repairersApi } from '@/lib/api';
import { ApiRepairer } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { RepairerCard } from '@/components/marketplace/RepairerCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  X,
  RotateCcw,
  Wrench,
  AlertCircle,
} from 'lucide-react';

function RepairersContent() {
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get('category');
  const queryBrand = searchParams.get('brand');

  const [repairers, setRepairers] = useState<ApiRepairer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    queryCategory ? queryCategory.toUpperCase() : 'ALL'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(
    queryBrand ? queryBrand : 'ALL'
  );
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const loadRepairers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load directory of specialists (page 1, up to 100 items)
      const data = await repairersApi.list({ limit: 100 });
      setRepairers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve specialist directory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepairers();
  }, [loadRepairers]);

  // Extract distinct categories from dataset
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    repairers.forEach((r) => {
      r.specializations?.forEach((s) => {
        if (s.deviceCategory) set.add(s.deviceCategory);
      });
    });
    return Array.from(set).sort();
  }, [repairers]);

  // Extract distinct brands from dataset
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    repairers.forEach((r) => {
      r.specializations?.forEach((s) => {
        if (s.brand) set.add(s.brand);
      });
    });
    return Array.from(set).sort();
  }, [repairers]);

  // Client-side multi-faceted filtering
  const filteredRepairers = useMemo(() => {
    return repairers.filter((repairer) => {
      // 1. Verification filter
      if (verifiedOnly && repairer.verificationStatus !== 'VERIFIED') {
        return false;
      }

      // 2. Minimum rating filter
      if (minRating > 0 && repairer.rating < minRating) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'ALL') {
        const matchesCategory = repairer.specializations?.some(
          (s) => s.deviceCategory.toUpperCase() === selectedCategory.toUpperCase()
        );
        if (!matchesCategory) return false;
      }

      // 4. Brand filter
      if (selectedBrand !== 'ALL') {
        const matchesBrand = repairer.specializations?.some(
          (s) => s.brand.toLowerCase() === selectedBrand.toLowerCase()
        );
        if (!matchesBrand) return false;
      }

      // 5. Search query (matches workshop name, address, description, or service types)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = repairer.businessName.toLowerCase().includes(q);
        const matchesAddress = repairer.address.toLowerCase().includes(q);
        const matchesDesc = repairer.description?.toLowerCase().includes(q) || false;
        const matchesService = repairer.specializations?.some(
          (s) =>
            s.serviceType.toLowerCase().includes(q) ||
            s.brand.toLowerCase().includes(q) ||
            s.deviceCategory.toLowerCase().includes(q)
        ) || false;

        if (!matchesName && !matchesAddress && !matchesDesc && !matchesService) {
          return false;
        }
      }

      return true;
    });
  }, [repairers, verifiedOnly, minRating, selectedCategory, selectedBrand, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedBrand !== 'ALL' ||
    minRating > 0 ||
    verifiedOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setMinRating(0);
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Repair Specialist Registry"
        subtitle="Discover verified independent laboratories, micro-soldering technicians, and authorized component repair specialists."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Specialists' }
        ]}
        meta={
          !isLoading && (
            <Badge variant="neutral" size="sm">
              {repairers.length} WORKSHOPS REGISTERED
            </Badge>
          )
        }
        actions={
          <Link href="/report">
            <Button variant="primary">Report a Problem</Button>
          </Link>
        }
      />

      {/* Directory Filter Controls */}
      <section
        aria-label="Directory Filter Controls"
        className="bg-white border border-stone-200 rounded-[3px] p-4 space-y-4 shadow-2xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <label htmlFor="search-specialists" className="sr-only">
              Search by workshop, city, or specialty
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="search-specialists"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workshop, location, or repair specialty…"
                className="w-full h-8.5 pl-9 pr-8 text-xs bg-stone-50 border border-stone-200 rounded-[2px] text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="min-w-[44px] min-h-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                  aria-label="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="filter-category" className="sr-only">
              Filter by Device Category
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 sm:h-8.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-[2px] text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
            >
              <option value="ALL">Category: Any</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label htmlFor="filter-brand" className="sr-only">
              Filter by Brand
            </label>
            <select
              id="filter-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full h-10 sm:h-8.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-[2px] text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
            >
              <option value="ALL">Brand: Any</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label htmlFor="filter-rating" className="sr-only">
              Filter by Minimum Rating
            </label>
            <select
              id="filter-rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full h-10 sm:h-8.5 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-[2px] text-stone-800 focus:bg-white focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
            >
              <option value={0}>Rating: Any</option>
              <option value={4.5}>★ 4.5 and above</option>
              <option value={4.0}>★ 4.0 and above</option>
            </select>
          </div>
        </div>

        {/* Filter Meta & Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span role="status" aria-live="polite" className="text-stone-500">
              Showing <strong className="text-stone-900 font-bold">{filteredRepairers.length}</strong> of{' '}
              {repairers.length} specialists
            </span>

            {/* Verification Checkbox */}
            <label className="min-h-[44px] inline-flex items-center gap-2 cursor-pointer text-stone-700 select-none pl-3 border-l border-stone-200 touch-manipulation py-1">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded-[2px] border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-900"
              />
              <span className="text-xs font-sans">Verified only</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[44px] inline-flex items-center gap-1 text-[11px] text-orange-700 hover:text-orange-800 underline underline-offset-2 transition-colors px-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </section>

      {/* Directory Content Area */}
      <section aria-label="Specialist Directory Grid">
        {isLoading ? (
          // Loading Skeleton Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 bg-stone-100 rounded-[3px] border border-stone-200 p-5 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-3/4">
                    <div className="h-4 bg-stone-200 rounded-[2px] w-2/3" />
                    <div className="h-3 bg-stone-200 rounded-[2px] w-1/2" />
                  </div>
                  <div className="h-4 bg-stone-200 rounded-[2px] w-12" />
                </div>
                <div className="h-8 bg-stone-200 rounded-[2px] w-full" />
                <div className="h-4 bg-stone-200 rounded-[2px] w-1/3 pt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="bg-red-50 border border-red-200 rounded-[3px] p-8 text-center space-y-3 max-w-lg mx-auto">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-red-900 tracking-tight">Registry Retrieval Error</h3>
            <p className="text-xs text-red-700">{error}</p>
            <div className="pt-2">
              <Button variant="secondary" size="sm" onClick={loadRepairers}>
                Retry Registry Connection
              </Button>
            </div>
          </div>
        ) : filteredRepairers.length === 0 ? (
          // Empty State
          <div className="bg-white border border-stone-200 rounded-[3px] p-12 text-center space-y-4 max-w-md mx-auto shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                No Specialists Match Your Criteria
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {hasActiveFilters
                  ? 'Try clearing specific category, brand, or location filters to view all registered workshops.'
                  : 'No repair specialists are currently registered in the database.'}
              </p>
            </div>
            {hasActiveFilters && (
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Reset All Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Specialists Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepairers.map((repairer) => (
              <RepairerCard
                key={repairer.id}
                repairer={repairer}
                targetCategory={selectedCategory}
                targetBrand={selectedBrand}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function RepairersPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-mono text-xs text-stone-400">INITIALIZING SPECIALIST REGISTRY…</div>}>
      <RepairersContent />
    </Suspense>
  );
}
