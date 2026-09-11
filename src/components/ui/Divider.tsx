import React from 'react';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className = '' }: DividerProps) {
  if (!label) {
    return <hr className={`border-t border-stone-200 my-6 ${className}`} />;
  }

  return (
    <div className={`relative my-8 ${className}`}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-stone-200" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-stone-50 pr-3 text-[10px] font-mono uppercase tracking-widest text-stone-400">
          {label}
        </span>
      </div>
    </div>
  );
}
