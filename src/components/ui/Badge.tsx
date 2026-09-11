import React from 'react';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'rust' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    rust: 'bg-orange-50 text-orange-800 border-orange-200',
    outline: 'bg-transparent text-stone-600 border-stone-300'
  };

  const dotColors = {
    neutral: 'bg-stone-500',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
    rust: 'bg-orange-600',
    outline: 'bg-stone-400'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider uppercase font-mono',
    md: 'text-xs px-2 py-0.5 tracking-tight font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
}
