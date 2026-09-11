import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none text-xs tracking-tight';

  const variantStyles = {
    primary: 'bg-stone-900 text-stone-50 hover:bg-stone-800 active:bg-stone-950 border border-stone-900',
    accent: 'bg-orange-700 text-white hover:bg-orange-800 active:bg-orange-900 border border-orange-800',
    secondary: 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 hover:border-stone-400 active:bg-stone-100',
    ghost: 'text-stone-600 hover:text-stone-950 hover:bg-stone-100 active:bg-stone-200 border border-transparent',
    danger: 'bg-red-700 text-white hover:bg-red-800 border border-red-800'
  };

  const sizeStyles = {
    sm: 'h-7 px-2.5 gap-1.5 rounded-[2px] text-xs',
    md: 'h-8.5 px-3 gap-1.5 rounded-[2px] text-xs',
    lg: 'h-9.5 px-4 gap-2 rounded-[2px] text-xs sm:text-sm'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
