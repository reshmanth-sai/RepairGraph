'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { devicesApi, ApiDevice, DeviceCategory, DeviceCondition } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { sanitizeErrorMessage } from '@/lib/sanitizeError';
import {
  Laptop,
  Smartphone,
  Headphones,
  Tv,
  Tablet,
  Plus,
  ArrowRight,
  Wrench,
  Trash2,
  X,
  AlertCircle,
  Edit3
} from 'lucide-react';

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'attention' | 'in_repair' | 'under_warranty'>('all');

  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Add Device Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<DeviceCategory>('LAPTOP');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formSerialNumber, setFormSerialNumber] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formCurrentValue, setFormCurrentValue] = useState('');
  const [formCondition, setFormCondition] = useState<DeviceCondition>('GOOD');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Device Modal State
  const [editingDevice, setEditingDevice] = useState<ApiDevice | null>(null);
  const [editCategory, setEditCategory] = useState<DeviceCategory>('LAPTOP');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editCurrentValue, setEditCurrentValue] = useState('');
  const [editCondition, setEditCondition] = useState<DeviceCondition>('GOOD');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const closeEditModal = () => {
    setEditingDevice(null);
  };

  const addModalTrapRef = useFocusTrap({
    isOpen: isAddModalOpen,
    onClose: closeAddModal,
    disableFocusTrap: formSubmitting,
  });

  const editModalTrapRef = useFocusTrap({
    isOpen: !!editingDevice,
    onClose: closeEditModal,
    disableFocusTrap: editSubmitting,
  });

  const openAddModal = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setIsAddModalOpen(true);
  };

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await devicesApi.list();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch devices catalog.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices, user]);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      await devicesApi.create({
        category: formCategory,
        brand: formBrand.trim(),
        model: formModel.trim(),
        serialNumber: formSerialNumber.trim(),
        purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : null,
        currentValue: formCurrentValue ? parseFloat(formCurrentValue) : null,
        condition: formCondition,
      });

      // Reset form & close
      setFormBrand('');
      setFormModel('');
      setFormSerialNumber('');
      setFormPurchasePrice('');
      setFormCurrentValue('');
      setIsAddModalOpen(false);
      previousFocusRef.current?.focus();
      await fetchDevices();
    } catch (err: unknown) {
      setFormError(sanitizeErrorMessage(err, 'Failed to register device.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (device: ApiDevice) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setEditingDevice(device);
    setEditCategory(device.category);
    setEditBrand(device.brand);
    setEditModel(device.model);
    setEditSerialNumber(device.serialNumber);
    setEditPurchasePrice(device.purchasePrice ? device.purchasePrice.toString() : '');
    setEditCurrentValue(device.currentValue ? device.currentValue.toString() : '');
    setEditCondition(device.condition);
    setEditError(null);
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      await devicesApi.update(editingDevice.id, {
        category: editCategory,
        brand: editBrand.trim(),
        model: editModel.trim(),
        serialNumber: editSerialNumber.trim(),
        purchasePrice: editPurchasePrice ? parseFloat(editPurchasePrice) : null,
        currentValue: editCurrentValue ? parseFloat(editCurrentValue) : null,
        condition: editCondition,
      });

      setEditingDevice(null);
      previousFocusRef.current?.focus();
      await fetchDevices();
    } catch (err: unknown) {
      setEditError(sanitizeErrorMessage(err, 'Failed to update device record.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your registered devices?`)) {
      return;
    }

    try {
      await devicesApi.delete(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete device.');
    }
  };



  const getWarrantyStatus = (warrantyExpiry?: string | null) => {
    if (!warrantyExpiry) return 'expired';
    const exp = new Date(warrantyExpiry).getTime();
    const now = Date.now();
    if (exp <= now) return 'expired';
    if (exp - now < 30 * 24 * 3600 * 1000) return 'expiring_soon';
    return 'active';
  };

  const filteredDevices = devices.filter((d) => {
    const hasActiveRequest = (d.repairRequests || []).some(
      (r) => r.status === 'REQUESTED' || r.status === 'DIAGNOSING'
    );
    const isInRepair = (d.repairRequests || []).some(
      (r) =>
        r.status === 'ACCEPTED' ||
        r.status === 'WAITING_FOR_PART' ||
        r.status === 'REPAIRING' ||
        r.status === 'TESTING'
    );
    const isWarrantyActive = getWarrantyStatus(d.warrantyExpiry) === 'active';

    if (filter === 'attention') return hasActiveRequest;
    if (filter === 'in_repair') return isInRepair;
    if (filter === 'under_warranty') return isWarrantyActive;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP':
      case 'laptop':
        return <Laptop className="w-3.5 h-3.5 text-stone-600" />;
      case 'SMARTPHONE':
      case 'smartphone':
        return <Smartphone className="w-3.5 h-3.5 text-stone-600" />;
      case 'HEADPHONES':
      case 'audio':
        return <Headphones className="w-3.5 h-3.5 text-stone-600" />;
      case 'MONITOR':
        return <Tv className="w-3.5 h-3.5 text-stone-600" />;
      case 'TABLET':
        return <Tablet className="w-3.5 h-3.5 text-stone-600" />;
      default:
        return <Laptop className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
      case 'excellent':
        return <Badge variant="success">Excellent</Badge>;
      case 'GOOD':
      case 'good':
        return <Badge variant="neutral">Good</Badge>;
      case 'FAIR':
      case 'fair':
        return <Badge variant="warning">Fair</Badge>;
      case 'DEGRADED':
      case 'degraded':
      case 'CRITICAL':
      case 'critical':
        return <Badge variant="error">Degraded</Badge>;
      default:
        return <Badge variant="neutral">{condition}</Badge>;
    }
  };

  const getWarrantyBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" dot>Active</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning" dot>Expiring</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">Unregistered</Badge>;
    }
  };

  const assessedUnitsCount = devices.filter(
    (d) => (d.repairRequests || []).length > 0
  ).length;

  const totalFleetValue = devices.reduce((acc, d) => acc + (d.currentValue || 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hardware Registry"
        subtitle="Catalog of registered consumer hardware, technical repairability indices, and maintenance status."
        breadcrumbs={[
          { label: 'Overview', href: '/overview' },
          { label: 'Devices' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/report">
              <Button variant="secondary" icon={<Wrench className="w-3.5 h-3.5" />}>
                Report Issue
              </Button>
            </Link>
            <Button
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={openAddModal}
            >
              Add Device
            </Button>
          </div>
        }
      />

      {/* Fleet Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-0.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            Registered Units
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 tabular-nums">
            {isLoading ? '…' : devices.length}
            <span className="text-xs font-sans font-normal text-stone-500 ml-1.5">devices</span>
          </div>
        </div>

        <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            Assessed Units
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 tabular-nums">
            {isLoading ? '…' : assessedUnitsCount}
            <span className="text-xs font-mono font-normal text-stone-400 ml-1">
              / {devices.length} evaluated
            </span>
          </div>
        </div>

        <div className="space-y-0.5 sm:border-l sm:border-stone-200 sm:pl-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            Est. Fair Market Value
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 tabular-nums">
            {isLoading ? '…' : `₹${totalFleetValue.toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[2px] flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDevices()}
            className="font-semibold underline hover:text-red-950 font-mono"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 border-b sm:border-b-0 border-stone-200 pb-2 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Hardware' },
              { id: 'attention', label: 'Action Required' },
              { id: 'in_repair', label: 'In Repair' },
              { id: 'under_warranty', label: 'Under Warranty' }
            ] as const
          ).map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-2.5 py-1 text-xs rounded-[2px] font-medium transition-colors ${
                  active
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-stone-400 font-mono">
          {isLoading ? 'SYNCING DATA…' : `SHOWING ${filteredDevices.length} OF ${devices.length}`}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center text-xs font-mono text-stone-400">
          Loading devices catalog…
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredDevices.length === 0 && (
        <div className="py-16 text-center space-y-3 border border-dashed border-stone-200 rounded-[2px] p-8">
          <div className="w-9 h-9 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
            <Laptop className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-800">No hardware found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {filter !== 'all'
                ? `No devices matching the current "${filter}" filter.`
                : 'No hardware registered in your personal catalog. Register a device to track its lifecycle.'}
            </p>
          </div>
          {filter === 'all' && (
            <Button
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={openAddModal}
            >
              Add First Device
            </Button>
          )}
        </div>
      )}

      {/* Desktop Ledger Table */}
      {!isLoading && filteredDevices.length > 0 && (
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-2.5 pr-4 font-semibold">Hardware</th>
                <th className="py-2.5 px-3 font-semibold">Condition</th>
                <th className="py-2.5 px-3 font-semibold">Diagnostic Assessment</th>
                <th className="py-2.5 px-3 font-semibold">Warranty</th>
                <th className="py-2.5 px-3 font-semibold">Market Value</th>
                <th className="py-2.5 px-3 font-semibold">Status / Issue</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredDevices.map((device) => {
                const warrantyStatus = getWarrantyStatus(device.warrantyExpiry);
                const latestRequest = (device.repairRequests || [])[0];

                return (
                  <tr
                    key={device.id}
                    className="hover:bg-stone-100/40 transition-colors group"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-[2px] bg-stone-100 text-stone-700 shrink-0">
                          {getCategoryIcon(device.category)}
                        </div>
                        <div>
                          <Link
                            href={`/devices/${device.id}`}
                            className="font-semibold text-stone-900 hover:text-orange-800 transition-colors block text-xs sm:text-sm tracking-tight"
                          >
                            {device.brand} {device.model}
                          </Link>
                          <div className="flex items-center gap-2 font-mono text-[10px] text-stone-400 mt-0.5">
                            <span>SN: {device.serialNumber}</span>
                            {device.purchaseDate && (
                              <>
                                <span>•</span>
                                <span>Purchased: {new Date(device.purchaseDate).getFullYear()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getConditionBadge(device.condition)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {latestRequest ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              latestRequest.status === 'COMPLETED'
                                ? 'bg-emerald-600'
                                : latestRequest.status === 'CANCELLED'
                                ? 'bg-stone-400'
                                : 'bg-amber-600'
                            }`}
                          />
                          <span className="font-mono text-xs font-semibold text-stone-800">
                            {latestRequest.status}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-stone-400 text-[11px]">No diagnostic yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getWarrantyBadge(warrantyStatus)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono tabular-nums text-stone-800">
                      ₹{(device.currentValue || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-3">
                      {latestRequest ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-stone-900 text-xs">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                latestRequest.status === 'COMPLETED'
                                  ? 'bg-emerald-600'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {latestRequest.status}
                          </span>
                          <span className="block text-[11px] text-stone-500 truncate max-w-xs">
                            {latestRequest.description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px] font-mono">
                          Nominal
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/passport?deviceId=${device.id}`}
                          className="inline-flex items-center text-[11px] font-mono text-stone-600 hover:text-stone-950 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-[2px] transition-colors"
                          title="View device passport"
                        >
                          Passport
                        </Link>
                        <Link
                          href={`/devices/${device.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-950 p-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(device)}
                          title="Edit device record"
                          className="p-1 text-stone-400 hover:text-stone-800 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteDevice(device.id, `${device.brand} ${device.model}`)
                          }
                          title="Remove device"
                          className="p-1 text-stone-400 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Stacked View */}
      {!isLoading && filteredDevices.length > 0 && (
        <div className="sm:hidden divide-y divide-stone-200">
          {filteredDevices.map((device) => {
            const warrantyStatus = getWarrantyStatus(device.warrantyExpiry);
            const latestRequest = (device.repairRequests || [])[0];

            return (
              <div key={device.id} className="py-3.5 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-[2px] bg-stone-100 text-stone-700">
                      {getCategoryIcon(device.category)}
                    </div>
                    <div>
                      <Link
                        href={`/devices/${device.id}`}
                        className="font-semibold text-stone-900"
                      >
                        {device.brand} {device.model}
                      </Link>
                      <div className="font-mono text-[10px] text-stone-400">
                        SN: {device.serialNumber} • FMV: ₹{(device.currentValue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  {getConditionBadge(device.condition)}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                  {latestRequest ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          latestRequest.status === 'COMPLETED'
                            ? 'bg-emerald-600'
                            : latestRequest.status === 'CANCELLED'
                            ? 'bg-stone-400'
                            : 'bg-amber-600'
                        }`}
                      />
                      <span className="font-mono text-[11px] font-semibold text-stone-800">
                        {latestRequest.status}
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-stone-400 text-[11px]">No diagnostic yet</span>
                  )}
                  {getWarrantyBadge(warrantyStatus)}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/passport?deviceId=${device.id}`}
                      className="text-stone-600 hover:text-stone-900 font-mono text-[11px]"
                    >
                      Passport
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEditModal(device)}
                      className="text-stone-600 hover:text-stone-900 font-medium"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/devices/${device.id}`}
                      className="text-stone-800 font-semibold underline underline-offset-2"
                    >
                      Inspect →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Device Modal Dialog */}
      {isAddModalOpen && (
        <div
          ref={addModalTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-hardware-title"
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !formSubmitting && closeAddModal()}
        >
          <div
            className="bg-white border border-stone-300 rounded-[3px] shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 id="register-hardware-title" className="text-base font-bold text-stone-900 tracking-tight">
                  Register New Hardware
                </h3>
                <p className="text-[11px] text-stone-500">
                  Add a device to your authenticated inventory for lifecycle tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div role="alert" aria-live="assertive" className="p-3 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="reg-category" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Category
                  </label>
                  <select
                    id="reg-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DeviceCategory)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="SMARTPHONE">Smartphone</option>
                    <option value="TABLET">Tablet</option>
                    <option value="HEADPHONES">Headphones</option>
                    <option value="MONITOR">Monitor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-condition" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Condition
                  </label>
                  <select
                    id="reg-condition"
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as DeviceCondition)}
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
                  <label htmlFor="reg-brand" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Brand *
                  </label>
                  <input
                    id="reg-brand"
                    type="text"
                    required
                    placeholder="e.g. Lenovo, Apple, Dell"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-model" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Model *
                  </label>
                  <input
                    id="reg-model"
                    type="text"
                    required
                    placeholder="e.g. ThinkPad T14, MacBook Air"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-serial" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                  Serial Number *
                </label>
                <input
                  id="reg-serial"
                  type="text"
                  required
                  placeholder="e.g. PF-3B79K2"
                  value={formSerialNumber}
                  onChange={(e) => setFormSerialNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="reg-price" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Purchase Price (₹)
                  </label>
                  <input
                    id="reg-price"
                    type="number"
                    min="0"
                    placeholder="e.g. 75000"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-val" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Est. Market Value (₹)
                  </label>
                  <input
                    id="reg-val"
                    type="number"
                    min="0"
                    placeholder="e.g. 48000"
                    value={formCurrentValue}
                    onChange={(e) => setFormCurrentValue(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeAddModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Registering…' : 'Register Hardware'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Device Modal Dialog */}
      {editingDevice && (
        <div
          ref={editModalTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-hardware-title"
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !editSubmitting && closeEditModal()}
        >
          <div
            className="bg-white border border-stone-300 rounded-[3px] shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 id="edit-hardware-title" className="text-base font-bold text-stone-900 tracking-tight">
                  Edit Hardware Record
                </h3>
                <p className="text-[11px] text-stone-500 font-mono break-all">
                  UNIT ID: {editingDevice.id.slice(0, 12)}… • {editingDevice.brand} {editingDevice.model}
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

            <form onSubmit={handleUpdateDevice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="edit-category" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Category
                  </label>
                  <select
                    id="edit-category"
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
                  <label htmlFor="edit-condition" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Condition
                  </label>
                  <select
                    id="edit-condition"
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
                  <label htmlFor="edit-brand" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Brand *
                  </label>
                  <input
                    id="edit-brand"
                    type="text"
                    required
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-model" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Model *
                  </label>
                  <input
                    id="edit-model"
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-serial" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                  Serial Number *
                </label>
                <input
                  id="edit-serial"
                  type="text"
                  required
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="edit-price" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Purchase Price (₹)
                  </label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-[2px] text-stone-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-val" className="block font-bold uppercase tracking-wider text-stone-600 font-mono text-[10px]">
                    Est. Market Value (₹)
                  </label>
                  <input
                    id="edit-val"
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
