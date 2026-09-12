import React from 'react';

export type StatusType = 'idle' | 'attention' | 'in_progress' | 'verified' | 'completed' | 'critical';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className = '' }: StatusIndicatorProps) {
  const configs = {
    idle: { color: 'bg-stone-400', label: 'Idle / Unregistered' },
    attention: { color: 'bg-amber-600', label: 'Action Required' },
    in_progress: { color: 'bg-orange-600', label: 'In Repair' },
    verified: { color: 'bg-stone-900', label: 'Verified' },
    completed: { color: 'bg-emerald-600', label: 'Completed' },
    critical: { color: 'bg-red-600', label: 'Degraded' }
  };

  const current = configs[status] || configs.idle;

  return (
    <div
      role="status"
      aria-label={label || current.label}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'in_progress' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.color}`} />
      </span>
      {label && <span className="text-xs text-stone-700 font-medium">{label}</span>}
    </div>
  );
}
