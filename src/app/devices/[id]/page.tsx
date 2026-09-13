'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { devicesApi, ApiDeviceDetail, DeviceCategory, DeviceCondition } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { sanitizeErrorMessage } from '@/lib/sanitizeError';
import {
  Wrench,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Edit3,
  X,
} from 'lucide-react';

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<ApiDeviceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<DeviceCategory>('LAPTOP');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editCurrentValue, setEditCurrentValue] = useState('');
  const [editCondition, setEditCondition] = useState<DeviceCondition>('GOOD');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const editModalTrapRef = useFocusTrap({
    isOpen: isEditModalOpen,
    onClose: closeEditModal,
    disableFocusTrap: editSubmitting,
  });

  const openEditModal = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setIsEditModalOpen(true);
  };

  const loadDevice = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await devicesApi.getById(deviceId);
      setDevice(data);
      setEditCategory(data.category);
      setEditBrand(data.brand);
      setEditModel(data.model);
      setEditSerialNumber(data.serialNumber);
      setEditPurchasePrice(data.purchasePrice ? data.purchasePrice.toString() : '');
      setEditCurrentValue(data.currentValue ? data.currentValue.toString() : '');
      setEditCondition(data.condition);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load device record.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      await devicesApi.update(device.id, {
        category: editCategory,
        brand: editBrand.trim(),
        model: editModel.trim(),
        serialNumber: editSerialNumber.trim(),
        purchasePrice: editPurchasePrice ? parseFloat(editPurchasePrice) : null,
        currentValue: editCurrentValue ? parseFloat(editCurrentValue) : null,
        condition: editCondition,
      });

      await loadDevice();
      closeEditModal();
    } catch (err: unknown) {
      setEditError(sanitizeErrorMessage(err, 'Failed to update device record.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-2 font-mono text-xs text-stone-400">
        <div>ACCESSING DEVICE TELEMETRY RECORD…</div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="py-20 text-center space-y-3 max-w-md mx-auto">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-500">
          <AlertCircle className="w-5 h-5 text-stone-600" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 tracking-tight">
          Device Record Not Accessible
        </h2>
        <p className="text-xs text-stone-500">
          {error || 'The requested hardware record does not exist or you do not have permission to view it.'}
        </p>
        <div className="pt-2">
          <Link href="/devices">
            <Button variant="secondary">Return to Registry</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Active Issue (Open repair request)
  const activeRequest = (device.repairRequests || []).find(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
  );

  // Warranty status calculation
  const getWarrantyStatus = (warrantyExpiry?: string | null) => {
    if (!warrantyExpiry) return 'expired';
    const exp = new Date(warrantyExpiry).getTime();
    const now = Date.now();
    if (exp <= now) return 'expired';
    if (exp - now < 30 * 24 * 3600 * 1000) return 'expiring_soon';
    return 'active';
  };
  const warrantyStatus = getWarrantyStatus(device.warrantyExpiry);

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
      case 'excellent':
        return <Badge variant="success">Condition: Excellent</Badge>;
      case 'GOOD':
      case 'good':
        return <Badge variant="neutral">Condition: Good</Badge>;
      case 'FAIR':
      case 'fair':
        return <Badge variant="warning">Condition: Fair</Badge>;
      case 'DEGRADED':
      case 'degraded':
      case 'CRITICAL':
      case 'critical':
        return <Badge variant="error">Condition: Degraded</Badge>;
      default:
        return <Badge variant="neutral">{condition}</Badge>;
    }
  };

  // Extract real persisted diagnostic recommendation from device history
  const latestRequestWithDiag = (device.repairRequests || []).find(
    (r) => r.recommendation || r.diagnosis
  );
  const realRecommendation = latestRequestWithDiag?.recommendation;
  const realDiagnosis = latestRequestWithDiag?.diagnosis;

  const purchasePrice = device.purchasePrice || 0;
  const currentValue = device.currentValue || 0;
  const depreciationPct = purchasePrice > 0 ? Math.round(((purchasePrice - currentValue) / purchasePrice) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* 1. Technical Identity Header */}
      <PageHeader
        title={`${device.brand} ${device.model}`}
        subtitle={`Hardware Unit Record • Serial: ${device.serialNumber} • Category: ${device.category}`}
        breadcrumbs={[
          { label: 'Overview', href: '/overview' },
          { label: 'Devices', href: '/devices' },
          { label: `${device.brand} ${device.model}` }
        ]}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {getConditionBadge(device.condition)}
            <Badge variant={warrantyStatus === 'active' ? 'success' : 'outline'} dot>
              {warrantyStatus === 'active' ? 'Under Warranty' : 'Warranty Expired'}
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={openEditModal}
            >
              Edit Hardware
            </Button>
            <Link href={`/passport?deviceId=${device.id}`}>
              <Button variant="secondary" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                Repair Passport
              </Button>
            </Link>
            <Link href={`/report?deviceId=${device.id}`}>
              <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
                Diagnose / Report Problem
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Current Issue & Diagnostic Callout */}
      {activeRequest ? (
        <section aria-labelledby="active-issue-title" className="border-l-2 border-l-amber-600 border border-stone-200 bg-white p-5 rounded-[2px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-semibold block">
                  Active Lifecycle Request // STATUS: {activeRequest.status}
                </span>
                <h2 id="active-issue-title" className="text-base font-bold text-stone-900 tracking-tight">
                  {activeRequest.diagnosis?.possibleIssue || 'Reported Hardware Fault'}
                </h2>
              </div>
            </div>
            {activeRequest.diagnosis && (
              <span className="font-mono text-xs text-stone-500">
                Confidence: {activeRequest.diagnosis.confidence}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-stone-400 block mb-1">
                Reported Symptoms & Notes
              </span>
              <p className="text-stone-700 leading-relaxed">
                {activeRequest.description}
              </p>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase text-stone-400 block mb-1">
                Estimated Repair Benchmark
              </span>
              {activeRequest.recommendation ? (
                <div className="space-y-0.5">
                  <div className="font-mono text-base font-bold text-stone-900 tabular-nums">
                    ₹{activeRequest.recommendation.estimatedCostMin.toLocaleString('en-IN')} – ₹{activeRequest.recommendation.estimatedCostMax.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Recommended Action: <strong className="text-stone-800 font-semibold">{activeRequest.recommendation.recommendedAction}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-stone-500 italic">
                  Awaiting quote submission from certified specialists.
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-stone-400 block mb-1">
                  Urgency Level
                </span>
                <Badge variant={activeRequest.urgency === 'HIGH' ? 'error' : 'warning'}>
                  {activeRequest.urgency} Urgency
                </Badge>
              </div>
              <div className="pt-3">
                <Link href="/repairs">
                  <Button variant="secondary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Track in Repairs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="p-4 bg-stone-100/60 border border-stone-200 rounded-[2px] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>All diagnostics nominal. No open technical faults recorded for this unit.</span>
          </div>
          <Link href={`/report?deviceId=${device.id}`}>
            <span className="text-orange-800 hover:text-orange-950 font-semibold font-mono underline">
              Report Symptom →
            </span>
          </Link>
        </section>
      )}

      {/* 3. Valuation & Purchase Technical Specs */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-y border-stone-200 py-5">
        <div className="space-y-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            Initial Acquisition
          </div>
          <div className="font-mono text-lg font-bold text-stone-900 tabular-nums">
            {purchasePrice > 0 ? `₹${purchasePrice.toLocaleString('en-IN')}` : 'Unrecorded'}
          </div>
          {device.purchaseDate && (
            <div className="text-[11px] text-stone-500 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{new Date(device.purchaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            Fair Market Valuation
          </div>
          <div className="font-mono text-lg font-bold text-stone-900 tabular-nums">
            ₹{currentValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            {depreciationPct > 0 ? `-${depreciationPct}% depreciation` : 'Holding residual value'}
          </div>
        </div>

        <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            Manufacturer Warranty
          </div>
          <div className="font-mono text-lg font-bold text-stone-900">
            {warrantyStatus === 'active' ? 'Active Coverage' : 'Expired'}
          </div>
          {device.warrantyExpiry && (
            <div className="text-[11px] text-stone-500 font-mono">
              Expires {new Date(device.warrantyExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
            </div>
          )}
        </div>

        <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            Repairability Index
          </div>
          {realRecommendation ? (
            <>
              <div className="font-mono text-lg font-bold text-stone-900">
                {realRecommendation.repairabilityScore}{' '}
                <span className="text-xs text-stone-400 font-normal">/100</span>
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                Verdict: {realRecommendation.recommendedAction}
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-base font-semibold text-stone-500">
                Not assessed
              </div>
              <div className="text-[11px] text-stone-400">
                No diagnostic history
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Diagnostic Evaluation & Lifecycle Assessment */}
      <section className="space-y-4">
        <div className="border-b border-stone-200 pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">
              Diagnostic Evaluation & Repairability Assessment
            </h3>
            <p className="text-xs text-stone-500">
              Technical feasibility, component serviceability, and fair-market economics evaluated by RepairGraph.
            </p>
          </div>
          {realRecommendation && (
            <Link href="/repairs" className="text-xs font-semibold text-stone-700 hover:text-stone-900 underline underline-offset-2">
              View in Repairs Dashboard →
            </Link>
          )}
        </div>

        {realRecommendation ? (
          <div className="p-5 bg-white border border-stone-200 rounded-[2px] space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Recommended Lifecycle Action
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge
                    variant={
                      realRecommendation.recommendedAction === 'DIY'
                        ? 'success'
                        : realRecommendation.recommendedAction === 'REPAIR'
                        ? 'rust'
                        : realRecommendation.recommendedAction === 'RESELL'
                        ? 'warning'
                        : 'error'
                    }
                    size="md"
                  >
                    {realRecommendation.recommendedAction}
                  </Badge>
                  {realDiagnosis && (
                    <span className="text-xs font-bold text-stone-900">
                      {realDiagnosis.possibleIssue}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] font-mono uppercase text-stone-400">Repairability</div>
                  <div className="font-mono text-base font-bold text-stone-900">
                    {realRecommendation.repairabilityScore}
                    <span className="text-xs text-stone-400 font-normal">/100</span>
                  </div>
                </div>
                <div className="border-l border-stone-200 pl-4">
                  <div className="text-[10px] font-mono uppercase text-stone-400">Economic Score</div>
                  <div className="font-mono text-base font-bold text-stone-900">
                    {realRecommendation.economicScore}
                    <span className="text-xs text-stone-400 font-normal">/100</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                  Fair-Market Repair Benchmark
                </span>
                <div className="font-mono text-sm font-bold text-stone-900">
                  ₹{realRecommendation.estimatedCostMin.toLocaleString('en-IN')} – ₹{realRecommendation.estimatedCostMax.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-stone-500">
                  Derived from regional service matrix and component replacement costs.
                </p>
              </div>

              {realDiagnosis && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-[2px] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                    Diagnostic Confidence & Category
                  </span>
                  <div className="font-mono text-sm font-bold text-stone-900">
                    {realDiagnosis.confidence}% Confidence
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Fault Class: {realDiagnosis.issueCategory}
                  </p>
                </div>
              )}
            </div>

            {realRecommendation.reasoning && (
              <div className="p-3.5 bg-stone-50/60 border border-stone-200 rounded-[2px] space-y-1.5 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-stone-600 block">
                  Assessment Reasoning
                </span>
                <p className="text-stone-700 leading-relaxed text-[11px]">
                  {realRecommendation.reasoning}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-stone-200 rounded-[2px] text-center space-y-3 bg-stone-50/40">
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <div className="text-xs font-bold text-stone-800">
                No Diagnostic History Logged
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                This hardware unit has not undergone a RepairGraph diagnostic evaluation yet. Submit symptoms to generate an audit-proof repairability score, component feasibility assessment, and fair-market cost analysis.
              </p>
            </div>
            <div className="pt-1">
              <Link href={`/report?deviceId=${device.id}`}>
                <Button variant="primary" icon={<Wrench className="w-3.5 h-3.5" />}>
                  Diagnose Hardware Problem
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. Verified Service History & Maintenance Ledger */}
      <section className="space-y-4">
        <div className="border-b border-stone-200 pb-2 flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">
              Verified Service History & Maintenance Ledger
            </h3>
            <p className="text-xs text-stone-500">
              Permanent maintenance entries recorded for this serial number.
            </p>
          </div>
          <Link href="/passport">
            <span className="text-xs font-semibold text-orange-800 hover:text-orange-950 font-mono">
              View Global Passport →
            </span>
          </Link>
        </div>

        {(device.repairHistory || []).length > 0 ? (
          <div className="space-y-3">
            {device.repairHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-white border border-stone-200 rounded-[2px] space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{entry.repairType}</span>
                    <Badge variant="success">Verified Service</Badge>
                  </div>
                  <span className="font-mono text-stone-400 text-[11px]">
                    {new Date(entry.repairDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px]">
                  <div>
                    <span className="font-mono text-stone-400 uppercase text-[10px] block">
                      Issue Handled
                    </span>
                    <span className="text-stone-700">{entry.issue}</span>
                  </div>

                  <div>
                    <span className="font-mono text-stone-400 uppercase text-[10px] block">
                      Certified Provider
                    </span>
                    <span className="text-stone-900 font-semibold">
                      {entry.repairer?.businessName || 'Independent Technician'}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-stone-400 uppercase text-[10px] block">
                      Total Invoiced Cost
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{entry.cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {entry.partsReplaced && entry.partsReplaced.length > 0 && (
                  <div className="pt-1 text-[11px] text-stone-600 border-t border-stone-100">
                    <span className="font-mono text-stone-400 uppercase text-[10px] mr-1.5">
                      Parts Replaced:
                    </span>
                    {entry.partsReplaced.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-stone-200 rounded-[2px] text-xs text-stone-500">
            No historical maintenance or repair records logged for this unit serial number yet.
          </div>
        )}
      </section>

      {/* Edit Hardware Modal Dialog */}
      {isEditModalOpen && (
        <div
          ref={editModalTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-hardware-detail-title"
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !editSubmitting && closeEditModal()}
        >
          <div
            className="bg-white border border-stone-300 rounded-[3px] shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 id="edit-hardware-detail-title" className="text-base font-bold text-stone-900 tracking-tight">
                  Edit Hardware Record
                </h3>
                <p className="text-[11px] text-stone-500 font-mono break-all">
                  UNIT ID: {device.id.slice(0, 12)}… • {device.brand} {device.model}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-800">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="detail-edit-category" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Category
                  </label>
                  <select
                    id="detail-edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as DeviceCategory)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="SMARTPHONE">Smartphone</option>
                    <option value="TABLET">Tablet</option>
                    <option value="HEADPHONES">Headphones</option>
                    <option value="MONITOR">Monitor / TV</option>
                    <option value="OTHER">Other Hardware</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="detail-edit-condition" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Condition
                  </label>
                  <select
                    id="detail-edit-condition"
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as DeviceCondition)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="DEGRADED">Degraded</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="detail-edit-brand" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Brand *
                  </label>
                  <input
                    id="detail-edit-brand"
                    type="text"
                    required
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="detail-edit-model" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Model *
                  </label>
                  <input
                    id="detail-edit-model"
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="detail-edit-serial" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                  Serial Number *
                </label>
                <input
                  id="detail-edit-serial"
                  type="text"
                  required
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="detail-edit-price" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Purchase Price (₹)
                  </label>
                  <input
                    id="detail-edit-price"
                    type="number"
                    min="0"
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="detail-edit-val" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Est. Market Value (₹)
                  </label>
                  <input
                    id="detail-edit-val"
                    type="number"
                    min="0"
                    value={editCurrentValue}
                    onChange={(e) => setEditCurrentValue(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving Changes…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
