import React from 'react';
import { Check, Clock } from 'lucide-react';

export interface TimelineStep {
  stage: string;
  label: string;
  timestamp?: string;
  note?: string;
  completed: boolean;
  current: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function Timeline({ steps, className = '' }: TimelineProps) {
  return (
    <nav aria-label="Repair progress" className={className}>
      <ol className="relative pl-6 sm:pl-7 space-y-6 before:absolute before:left-[10px] sm:before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-stone-200">
        {steps.map((step, idx) => {
          return (
            <li
              key={idx}
              className="relative group"
              aria-current={step.current ? 'step' : undefined}
            >
              {/* Step indicator node */}
              <div
                className={`absolute -left-[23px] sm:-left-[26px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-mono transition-colors ${
                  step.completed
                    ? 'bg-stone-900 border-stone-900 text-stone-50'
                    : step.current
                    ? 'bg-orange-700 border-orange-700 text-white ring-2 ring-orange-100'
                    : 'bg-white border-stone-300 text-stone-400'
                }`}
              >
                {step.completed ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : step.current ? (
                  <Clock className="w-3 h-3 animate-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step details */}
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <h4
                    className={`text-xs font-semibold tracking-tight ${
                      step.current
                        ? 'text-stone-950 font-bold'
                        : step.completed
                        ? 'text-stone-900'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <span className="font-mono text-[11px] text-stone-400 tabular-nums">
                      {step.timestamp}
                    </span>
                  )}
                </div>

                {step.note && (
                  <p
                    className={`text-xs leading-relaxed max-w-2xl ${
                      step.current ? 'text-stone-700' : 'text-stone-500'
                    }`}
                  >
                    {step.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
