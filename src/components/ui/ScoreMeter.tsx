import React from 'react';
import { RepairabilityFactor } from '@/lib/types';

interface ScoreMeterProps {
  score: number;
  factors?: RepairabilityFactor[];
  compact?: boolean;
  className?: string;
}

export function ScoreMeter({ score, factors, compact = false, className = '' }: ScoreMeterProps) {
  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-800 bg-emerald-700';
    if (val >= 60) return 'text-stone-800 bg-stone-800';
    if (val >= 40) return 'text-amber-800 bg-amber-700';
    return 'text-red-800 bg-red-700';
  };

  const getScoreGrade = (val: number) => {
    if (val >= 80) return 'High Repairability';
    if (val >= 60) return 'Moderate Repairability';
    if (val >= 40) return 'Restricted Repairability';
    return 'Severe Repair Barriers';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          role="meter"
          aria-label="Repairability score"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-16 h-1.5 bg-stone-200 rounded-[1px] overflow-hidden"
        >
          <div
            className={`h-full ${getScoreColor(score).split(' ')[1]}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="font-mono text-xs font-semibold text-stone-900 tabular-nums">
          {score}
          <span className="text-stone-400 font-normal">/100</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
            Repairability Assessment
          </div>
          <div className="text-base font-bold text-stone-900 tracking-tight mt-0.5">
            {getScoreGrade(score)}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-stone-900 tabular-nums">
            {score}
          </span>
          <span className="text-sm font-mono text-stone-400">/100</span>
        </div>
      </div>

      {/* Main Meter */}
      <div className="space-y-1">
        <div
          role="meter"
          aria-label="Overall repairability index"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-1.5 bg-stone-200 rounded-[1px] overflow-hidden"
        >
          <div
            className={`h-full ${getScoreColor(score).split(' ')[1]}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-stone-400">
          <span>0 (Glued / Non-repairable)</span>
          <span>50 (Moderate)</span>
          <span>100 (Modular / Open Schematics)</span>
        </div>
      </div>

      {/* Detailed Factor Breakdown */}
      {factors && factors.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
            Factor Breakdown
          </div>
          <div className="divide-y divide-stone-100">
            {factors.map((factor) => {
              const pct = Math.round((factor.score / factor.maxScore) * 100);
              return (
                <div key={factor.name} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-medium text-stone-800">{factor.name}</span>
                    <span className="font-mono text-stone-900 tabular-nums text-xs">
                      {factor.score}
                      <span className="text-stone-400 font-normal">/{factor.maxScore}</span>
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={factor.name}
                    aria-valuenow={factor.score}
                    aria-valuemin={0}
                    aria-valuemax={factor.maxScore}
                    className="w-full h-1 bg-stone-100 rounded-[1px] overflow-hidden"
                  >
                    <div
                      className="h-full bg-stone-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] text-stone-500 gap-0.5">
                    <span>{factor.benchmark}</span>
                    <span className="text-stone-400 sm:text-right">{factor.notes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
