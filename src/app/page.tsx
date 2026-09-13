'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Wrench,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Activity,
  ExternalLink,
  Laptop,
  Smartphone,
  Check,
  Scale
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Interactive Simulator Data Types & Presets                                  */
/* -------------------------------------------------------------------------- */

interface DevicePreset {
  id: string;
  name: string;
  category: 'LAPTOP' | 'SMARTPHONE';
  icon: typeof Laptop;
  baselineScore: number;
  marketValue: number;
  fastenersScore: number; // /25
  partsScore: number; // /20
  manualsScore: number; // /15
  modularityScore: number; // /15
  pairingScore: number; // /10
  ageScore: number; // /10
  toolsScore: number; // /5
  specs: string;
}

interface SymptomScenario {
  id: string;
  name: string;
  description: string;
  penalty: number;
  repairCost: number;
  category: string;
  isHazard?: boolean;
}

const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'framework-13',
    name: 'Framework Laptop 13',
    category: 'LAPTOP',
    icon: Laptop,
    baselineScore: 94,
    marketValue: 72000,
    fastenersScore: 24,
    partsScore: 19,
    manualsScore: 15,
    modularityScore: 15,
    pairingScore: 10,
    ageScore: 7,
    toolsScore: 4,
    specs: 'Modular mainboard • Captive fasteners • QR code schematics'
  },
  {
    id: 'thinkpad-t14',
    name: 'ThinkPad T14 Gen 4',
    category: 'LAPTOP',
    icon: Laptop,
    baselineScore: 82,
    marketValue: 58000,
    fastenersScore: 21,
    partsScore: 18,
    manualsScore: 14,
    modularityScore: 12,
    pairingScore: 8,
    ageScore: 5,
    toolsScore: 4,
    specs: 'Official HMM manuals • Socketed RAM • Dual thermal heatpipes'
  },
  {
    id: 'macbook-pro-14',
    name: 'Apple MacBook Pro 14" M1',
    category: 'LAPTOP',
    icon: Laptop,
    baselineScore: 46,
    marketValue: 95000,
    fastenersScore: 10,
    partsScore: 11,
    manualsScore: 7,
    modularityScore: 3,
    pairingScore: 4,
    ageScore: 7,
    toolsScore: 4,
    specs: 'Unified soldered SOC • Cryptographic display pairing • Adhesive seams'
  },
  {
    id: 'pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    category: 'SMARTPHONE',
    icon: Smartphone,
    baselineScore: 68,
    marketValue: 52000,
    fastenersScore: 15,
    partsScore: 15,
    manualsScore: 11,
    modularityScore: 8,
    pairingScore: 8,
    ageScore: 7,
    toolsScore: 4,
    specs: '7-year parts commitment • Torx T3 fasteners • Direct OEM parts'
  }
];

const SYMPTOM_SCENARIOS: SymptomScenario[] = [
  {
    id: 'battery-drain',
    name: 'Battery Degradation (<65% capacity)',
    description: 'Noticeable battery throttling, rapid discharge under load.',
    penalty: 0,
    repairCost: 4500,
    category: 'Battery',
  },
  {
    id: 'cracked-display',
    name: 'Shattered Display & Digitizer',
    description: 'Spiderweb glass fracture with dead touch rows.',
    penalty: 5,
    repairCost: 14000,
    category: 'Display',
  },
  {
    id: 'thermal-throttle',
    name: 'Thermal Overheating & Fan Grinding',
    description: 'Dry thermal paste, clogged radiator fin stack, RPM drops.',
    penalty: 0,
    repairCost: 2200,
    category: 'Thermal',
  },
  {
    id: 'liquid-ingress',
    name: 'Liquid Ingress & PMIC Short',
    description: 'Corrosion traces along power rails, sudden device shutdown.',
    penalty: 25,
    repairCost: 38000,
    category: 'Motherboard',
    isHazard: true,
  }
];

/* -------------------------------------------------------------------------- */
/* Landing Page Component                                                     */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomScenario>(SYMPTOM_SCENARIOS[0]);

  // Compute live deterministic metrics
  const calculatedScore = Math.max(10, Math.min(98, selectedDevice.baselineScore - selectedSymptom.penalty));
  const rcr = selectedSymptom.repairCost / selectedDevice.marketValue;
  const economicScore = Math.max(0, Math.min(100, Math.round((1 - rcr) * 100)));

  // Lifecycle recommendation decision
  const getLifecycleVerdict = () => {
    if (selectedSymptom.isHazard && rcr > 0.45) {
      return {
        verdict: 'RECYCLE',
        badgeVariant: 'error' as const,
        description: 'Catastrophic board-level short. Channel through authorized statutory e-waste recyclers under E-Waste Rules 2022.',
      };
    }
    if (selectedDevice.id === 'framework-13' && selectedSymptom.id === 'battery-drain') {
      return {
        verdict: 'DIY',
        badgeVariant: 'success' as const,
        description: 'User-swappable modular battery with public QR guide. Zero workshop labor needed.',
      };
    }
    if (rcr <= 0.52 && calculatedScore >= 42) {
      return {
        verdict: 'REPAIR',
        badgeVariant: 'rust' as const,
        description: 'Economically viable. Repair preserves remaining fair market value and avoids e-waste.',
      };
    }
    if (rcr > 0.52 && rcr <= 0.75) {
      return {
        verdict: 'RESELL',
        badgeVariant: 'warning' as const,
        description: 'Marginal repair economics. Liquidating working subsystems provides higher return.',
      };
    }
    return {
      verdict: 'REPLACE',
      badgeVariant: 'error' as const,
      description: 'Repair cost exceeds 75% of residual asset value. Capital better deployed to modern hardware.',
    };
  };

  const verdict = getLifecycleVerdict();

  return (
    <div className="flex flex-col w-full text-stone-900 selection:bg-orange-100 selection:text-orange-950">

      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO SECTION                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative border-b border-stone-200 bg-[#FAFAF9] overflow-hidden">
        {/* Subtle grid accent background */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1c1917 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20 relative z-10">
          <div className="space-y-6 max-w-4xl">
            {/* Regulatory & System Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-stone-900 text-stone-100 rounded-[2px]">
                <Cpu className="w-3 h-3 text-orange-400" />
                RepairGraph v1.0
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium text-stone-600 bg-stone-200/70 border border-stone-300 rounded-[2px]">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Right to Repair India & E-Waste 2022 Aligned
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.08]">
              The deterministic intelligence engine for{' '}
              <span className="text-[#C2410C] underline decoration-stone-300 underline-offset-6">
                hardware repairability
              </span>{' '}
              & lifecycle economics.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-3xl">
              Replace guesswork and fragmented local repair workflows. RepairGraph unifies deterministic
              symptom diagnosis, 7-factor engineering scoring, fair-market lifecycle economics, and
              verifiable digital device passports.
            </p>

            {/* Primary Calls to Action */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/report">
                <Button variant="primary" size="lg" icon={<Wrench className="w-4 h-4" />}>
                  Diagnose Hardware Failure
                </Button>
              </Link>
              <Link href="/overview">
                <Button variant="secondary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                  Open Platform Dashboard
                </Button>
              </Link>
              <Link href="/passport">
                <Button variant="secondary" size="lg" icon={<ShieldCheck className="w-4 h-4" />}>
                  Explore Device Passports
                </Button>
              </Link>
            </div>

            {/* Key Engineering Pillars Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-stone-200">
              <div className="space-y-0.5">
                <div className="font-mono text-2xl font-bold tracking-tight text-stone-900">
                  &lt; 1 ms
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Deterministic Heuristic Engine
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  Zero LLM Hallucination
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-mono text-2xl font-bold tracking-tight text-stone-900">
                  7 Factors
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Engineering Score Matrix
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  Fasteners, Parts, Modularity...
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-mono text-2xl font-bold tracking-tight text-stone-900">
                  5 Actions
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Lifecycle Decision Matrix
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  DIY • Repair • Resell • Replace • Recycle
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="font-mono text-2xl font-bold tracking-tight text-stone-900">
                  100%
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  Verifiable Passport Records
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  Immutable Physical Serial Ledger
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INTERACTIVE DIAGNOSTIC SIMULATOR (SHOW, DON'T TELL)             */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-stone-200 bg-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 max-w-2xl mb-10">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
              Interactive Simulation Bench
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Test the Deterministic Decision Engine
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Select a real hardware architecture and trigger an active failure mode. Watch how RepairGraph
              computes the 7-factor repairability score, calculates the Repair Cost Ratio (RCR), and delivers an
              auditable statutory recommendation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls Column: Select Device & Symptom */}
            <div className="lg:col-span-5 space-y-6">
              {/* Step A: Select Device */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                  <span>1. Choose Hardware Profile</span>
                  <span className="text-stone-400 text-[10px] font-normal">4 benchmark units</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEVICE_PRESETS.map((dev) => {
                    const isSelected = selectedDevice.id === dev.id;
                    const Icon = dev.icon;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => setSelectedDevice(dev)}
                        className={`p-3 text-left border rounded-[2px] transition-all flex flex-col justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900 ${
                          isSelected
                            ? 'border-stone-900 bg-stone-100/90 shadow-2xs'
                            : 'border-stone-200 bg-[#FAFAF9] hover:bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C2410C]' : 'text-stone-500'}`} />
                          <span className="font-mono text-[10px] text-stone-500">
                            ₹{dev.marketValue.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900 leading-tight">
                            {dev.name}
                          </div>
                          <div className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                            {dev.specs}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step B: Select Failure Symptom */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                  <span>2. Inject Failure Symptom</span>
                  <span className="text-stone-400 text-[10px] font-normal">Heuristic triage signal</span>
                </label>
                <div className="space-y-2">
                  {SYMPTOM_SCENARIOS.map((sym) => {
                    const isSelected = selectedSymptom.id === sym.id;
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => setSelectedSymptom(sym)}
                        className={`w-full p-3 text-left border rounded-[2px] transition-all flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900 ${
                          isSelected
                            ? 'border-stone-900 bg-stone-100/90 shadow-2xs'
                            : 'border-stone-200 bg-[#FAFAF9] hover:bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-900">{sym.name}</span>
                            {sym.isHazard && (
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-red-100 text-red-800 rounded-[2px] font-bold">
                                HAZARD
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 leading-normal">
                            {sym.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-semibold text-stone-900">
                            ~₹{sym.repairCost.toLocaleString('en-IN')}
                          </div>
                          <div className="font-mono text-[9px] text-stone-400">
                            Est. Parts+Labor
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Telemetry Output: Score, Economics & Verdict */}
            <div className="lg:col-span-7 bg-[#FAFAF9] border border-stone-300 rounded-[3px] p-6 space-y-6 shadow-2xs">
              {/* Output Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    Deterministic Diagnostic Evaluation
                  </div>
                  <div className="text-sm font-bold text-stone-900">
                    {selectedDevice.name} • {selectedSymptom.category} Incident
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={verdict.badgeVariant} size="md">
                    VERDICT: {verdict.verdict}
                  </Badge>
                </div>
              </div>

              {/* Dynamic Score Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Repairability Score */}
                <div className="p-4 bg-white border border-stone-200 rounded-[2px] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    Repairability Index
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-extrabold text-stone-900">
                      {calculatedScore}
                    </span>
                    <span className="font-mono text-xs text-stone-400">/ 100</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        calculatedScore >= 70
                          ? 'bg-emerald-600'
                          : calculatedScore >= 45
                          ? 'bg-amber-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${calculatedScore}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1">
                    Baseline {selectedDevice.baselineScore} pts {selectedSymptom.penalty > 0 ? `(-${selectedSymptom.penalty} hazard penalty)` : ''}
                  </div>
                </div>

                {/* 2. Repair Cost Ratio */}
                <div className="p-4 bg-white border border-stone-200 rounded-[2px] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    Repair Cost Ratio (RCR)
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-extrabold text-stone-900">
                      {(rcr * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        rcr <= 0.35
                          ? 'bg-emerald-600'
                          : rcr <= 0.60
                          ? 'bg-amber-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(100, rcr * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1">
                    ₹{selectedSymptom.repairCost.toLocaleString('en-IN')} / ₹{selectedDevice.marketValue.toLocaleString('en-IN')} (Current Value)
                  </div>
                </div>

                {/* 3. Economic Preservation Score */}
                <div className="p-4 bg-white border border-stone-200 rounded-[2px] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    Value Preservation
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-extrabold text-stone-900">
                      {economicScore}
                    </span>
                    <span className="font-mono text-xs text-stone-400">/ 100</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-stone-900 transition-all duration-300"
                      style={{ width: `${economicScore}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1">
                    Asset equity retained
                  </div>
                </div>
              </div>

              {/* Decision Explanation Box */}
              <div className="p-4 bg-stone-100 border-l-3 border-[#C2410C] rounded-r-[2px] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-stone-900">
                    Lifecycle Rationale & Statutory Guidance:
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {verdict.description}
                </p>
              </div>

              {/* 7-Factor Subsystem Contribution Matrix */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-700">
                  7-Factor Architecture Contribution
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white border border-stone-200 rounded-[2px]">
                    <div className="text-[10px] text-stone-500">Disassembly (25%)</div>
                    <div className="font-mono font-bold text-stone-900">{selectedDevice.fastenersScore}/25 pts</div>
                  </div>
                  <div className="p-2 bg-white border border-stone-200 rounded-[2px]">
                    <div className="text-[10px] text-stone-500">Spare Parts (20%)</div>
                    <div className="font-mono font-bold text-stone-900">{selectedDevice.partsScore}/20 pts</div>
                  </div>
                  <div className="p-2 bg-white border border-stone-200 rounded-[2px]">
                    <div className="text-[10px] text-stone-500">Manuals (15%)</div>
                    <div className="font-mono font-bold text-stone-900">{selectedDevice.manualsScore}/15 pts</div>
                  </div>
                  <div className="p-2 bg-white border border-stone-200 rounded-[2px]">
                    <div className="text-[10px] text-stone-500">Modularity (15%)</div>
                    <div className="font-mono font-bold text-stone-900">{selectedDevice.modularityScore}/15 pts</div>
                  </div>
                </div>
              </div>

              {/* Action Bridge */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-stone-500">
                  Ready to test your actual physical device?
                </span>
                <Link href="/report">
                  <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Submit Real Symptom Diagnostic →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. THE 4-PILLAR PLATFORM ARCHITECTURE                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-stone-200 bg-[#FAFAF9] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
              Platform Architecture
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
              Four Interconnected Systems. Zero Black Boxes.
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              RepairGraph establishes a rigorous, transparent pipeline that takes hardware from initial defect
              symptom reporting to verified technician dispatch and verifiable lifecycle passports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white border border-stone-200 p-6 rounded-[3px] space-y-4 shadow-2xs hover:border-stone-400 transition-colors">
              <div className="w-9 h-9 bg-stone-100 rounded-[2px] border border-stone-200 flex items-center justify-center text-stone-900">
                <Laptop className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="space-y-1.5">
                <div className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                  01 // LEDGER
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Physical Hardware Catalog
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Maintain an auditable registry of devices with brand taxonomy, serial numbers, original invoice pricing, and current fair market valuations.
                </p>
              </div>
              <ul className="text-[11px] space-y-1 text-stone-500 pt-2 border-t border-stone-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Hardware serial registration
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Automated depreciation curves
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Warranty lifecycle tracking
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-stone-200 p-6 rounded-[3px] space-y-4 shadow-2xs hover:border-stone-400 transition-colors">
              <div className="w-9 h-9 bg-stone-100 rounded-[2px] border border-stone-200 flex items-center justify-center text-stone-900">
                <Activity className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="space-y-1.5">
                <div className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                  02 // TRIAGE
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Deterministic Diagnostics
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Heuristic symptom tokenization extracts affected subsystems (Display, Battery, Thermal, Logic-Board) and flags safety hazards like battery swelling.
                </p>
              </div>
              <ul className="text-[11px] space-y-1 text-stone-500 pt-2 border-t border-stone-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Sub-millisecond token parser
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Hazard & liquid ingress screening
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Severity & confidence signals
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-stone-200 p-6 rounded-[3px] space-y-4 shadow-2xs hover:border-stone-400 transition-colors">
              <div className="w-9 h-9 bg-stone-100 rounded-[2px] border border-stone-200 flex items-center justify-center text-stone-900">
                <Scale className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="space-y-1.5">
                <div className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                  03 // ECONOMICS
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Lifecycle Decision Matrix
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Weighs repair costs against current fair market value using the statutory Repair Cost Ratio (RCR) to deliver reproducible lifecycle verdicts.
                </p>
              </div>
              <ul className="text-[11px] space-y-1 text-stone-500 pt-2 border-t border-stone-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  7-Factor score calculation (100 pts)
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  RCR economic threshold modeling
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  E-Waste Rules 2022 compliance
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white border border-stone-200 p-6 rounded-[3px] space-y-4 shadow-2xs hover:border-stone-400 transition-colors">
              <div className="w-9 h-9 bg-stone-100 rounded-[2px] border border-stone-200 flex items-center justify-center text-stone-900">
                <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="space-y-1.5">
                <div className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                  04 // PROVENANCE
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Digital Device Passport
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Completed workshop repairs, replacement parts, and technician validations are sealed in a standardized, tamper-evident digital history passport.
                </p>
              </div>
              <ul className="text-[11px] space-y-1 text-stone-500 pt-2 border-t border-stone-100">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Multi-bid specialist marketplace
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Bench status progression tracking
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  Transferable service provenance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. THE 7-FACTOR REPAIRABILITY SCORE SPECIFICATION                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-stone-200 bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
                Engineering Model
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
                The 7-Factor Repairability Score Model
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Rather than an arbitrary metric, RepairGraph evaluates hardware design across 7 engineering
                dimensions informed by the French Repairability Index, European EN 45554 standards, and
                India&apos;s Right to Repair framework.
              </p>
            </div>
            <div className="font-mono text-xs bg-stone-100 p-3 rounded-[2px] border border-stone-200 text-stone-700 shrink-0">
              <span className="font-bold text-stone-900">Sum = 100 Points:</span> 25 + 20 + 15 + 15 + 10 + 10 + 5
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Factor 1 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">01 // Fasteners & Disassembly</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">25 PTS (25%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Evaluates standard Phillips/Torx captive screws vs ultrasonic welding, Pentalobe/tri-point screws, and perimeter glue seams requiring heat beds.
              </p>
            </div>

            {/* Factor 2 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">02 // Spare Parts Availability</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">20 PTS (20%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Commercial availability and lead times for OEM and certified aftermarket replacement modules in the domestic Indian supply chain.
              </p>
            </div>

            {/* Factor 3 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">03 // Documentation & Manuals</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">15 PTS (15%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Public availability of official Hardware Maintenance Manuals (HMM), circuit board schematics, torque specs, and diagnostic codes.
              </p>
            </div>

            {/* Factor 4 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">04 // Hardware Modularity</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">15 PTS (15%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Independent sub-assemblies, socketed SO-DIMM/M.2 slots, and modular cooling fans vs fully soldered unified memory and storage.
              </p>
            </div>

            {/* Factor 5 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">05 // Software Locks & Pairing</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">10 PTS (10%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Absence of cryptographic serialization pairing barriers; availability of public calibration tools without OEM cloud authorizations.
              </p>
            </div>

            {/* Factor 6 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">06 // Age & Lifecycle Support</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">10 PTS (10%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Remaining useful operational horizon and active security patch updates: max(0, min(10, round(10 - 1.5 × ageYears))).
              </p>
            </div>

            {/* Factor 7 */}
            <div className="p-5 border border-stone-200 bg-[#FAFAF9] rounded-[2px] space-y-2.5 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-stone-900">07 // Local Service Ecosystem & Diagnostic Tools</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-200 rounded-[2px]">5 PTS (5%)</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Density of verified independent repair workshops, micro-soldering laboratories, and accessibility of standard diagnostic equipment across metropolitan clusters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. VERIFIABLE DEVICE PASSPORT SHOWCASE                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-stone-200 bg-[#FAFAF9] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
                  Tamper-Evident Provenance
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
                  A Standardized Digital Passport for Every Physical Unit
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  When consumer hardware is resold or serviced, historical records are often lost or forged.
                  RepairGraph creates an immutable digital maintenance ledger tied to each physical serial number.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-[2px] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900">Serialized Service Stamps</div>
                    <div className="text-xs text-stone-600">
                      Every diagnostic check, quote acceptance, part replacement, and bench validation is signed by a certified technician.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-[2px] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900">Parts Transparency & Provenance</div>
                    <div className="text-xs text-stone-600">
                      Explicit tracking of OEM vs aftermarket component installations, original serial links, and warranty windows.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-[2px] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900">Protects Secondary Resale Value</div>
                    <div className="text-xs text-stone-600">
                      Demonstrates authentic service pedigree to buyers, eliminating lemons and preserving secondary market equity.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/passport">
                  <Button variant="primary" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    Inspect Sample Device Passport →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Passport Mock Card */}
            <div className="lg:col-span-6 bg-white border border-stone-300 rounded-[3px] p-6 shadow-sm space-y-5 font-mono">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-stone-900 rounded-[2px] flex items-center justify-center text-white text-[8px] font-bold">
                    RG
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">
                    DEVICE PASSPORT // #FRM-2024-0891
                  </span>
                </div>
                <Badge variant="success" size="sm" dot>
                  VERIFIED STAMPED
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[2px]">
                  <div className="text-[10px] text-stone-500 uppercase">Hardware Unit</div>
                  <div className="font-bold text-stone-900 font-sans mt-0.5">Framework 13 (Intel 13th Gen)</div>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[2px]">
                  <div className="text-[10px] text-stone-500 uppercase">Serial Number</div>
                  <div className="font-bold text-stone-900 mt-0.5">FRM-13-8942-IN</div>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[2px]">
                  <div className="text-[10px] text-stone-500 uppercase">Current Fair Value</div>
                  <div className="font-bold text-stone-900 mt-0.5">₹68,500 INR</div>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[2px]">
                  <div className="text-[10px] text-stone-500 uppercase">Repairability Index</div>
                  <div className="font-bold text-emerald-700 mt-0.5">94 / 100 (Class A)</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-stone-200 pt-4">
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                  Immutable Service History Ledger:
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-stone-50 border-l-2 border-emerald-600 rounded-r-[2px] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900 font-sans">Battery Module Replaced (55Wh OEM)</div>
                      <div className="text-[10px] text-stone-500">Tech: MicroTech Labs (ID: REPAIRER-02) • 90-Day Warranty</div>
                    </div>
                    <span className="text-[10px] text-stone-400">12 Aug 2024</span>
                  </div>
                  <div className="p-2.5 bg-stone-50 border-l-2 border-stone-400 rounded-r-[2px] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900 font-sans">Thermal Fan Cleaning & Repaste</div>
                      <div className="text-[10px] text-stone-500">Tech: Bangalore Precision Bench (ID: REPAIRER-01)</div>
                    </div>
                    <span className="text-[10px] text-stone-400">03 Feb 2024</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-200 flex items-center justify-between">
                <span>DIGITAL SIGNATURE: 0x9f8a...c4b1</span>
                <span>AUDIT STATUS: VALID</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. STATUTORY & REGULATORY POLICY ALIGNMENT                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-stone-200 bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C2410C]">
              Statutory Governance
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Anchored in National & Global Directives
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              RepairGraph translates theoretical statutory provisions into automated algorithmic logic
              protecting consumer rights and reducing toxic electronic waste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-stone-200 rounded-[3px] bg-[#FAFAF9] space-y-3">
              <div className="font-mono text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>Right to Repair India</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-900 rounded-[2px]">GOI / DCA</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Department of Consumer Affairs framework guaranteeing consumer access to authentic spare parts, diagnostic tools, third-party repair choice, and repair manuals without warranty voidance.
              </p>
              <a
                href="https://righttorepairindia.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-[#C2410C] underline underline-offset-4"
              >
                Official Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-6 border border-stone-200 rounded-[3px] bg-[#FAFAF9] space-y-3">
              <div className="font-mono text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>E-Waste Rules, 2022</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-800 rounded-[2px]">MOEFCC</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Ministry of Environment, Forest and Climate Change statutory recycling channels, Extended Producer Responsibility (EPR) targets, and formal authorized dismantler handoffs.
              </p>
              <span className="inline-block text-xs font-mono text-stone-500">
                Statutory RECYCLE Protocol
              </span>
            </div>

            <div className="p-6 border border-stone-200 rounded-[3px] bg-[#FAFAF9] space-y-3">
              <div className="font-mono text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>EU Right to Repair Directive</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-800 rounded-[2px]">EU 2024/1799</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Mandates manufacturer repair obligation beyond standard legal guarantees, transparent spare parts pricing, and independent repairer access without software barriers.
              </p>
              <a
                href="https://commission.europa.eu/law/law-topic/consumer-protection-law/directive-repair-goods_en"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-[#C2410C] underline underline-offset-4"
              >
                EU Directive <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. QUICK DEMONSTRATION PERSONAS & CONVERSION CTA                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-stone-900 text-stone-100 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block text-xs font-mono font-bold tracking-widest text-orange-400 uppercase">
              Ready to Explore the Platform?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Launch RepairGraph in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Explore pre-seeded test hardware and active repair tickets, or sign in instantly with one of our three demonstration personas.
            </p>
          </div>

          {/* Quick Persona Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link
              href="/login?redirect=/overview"
              className="p-5 bg-stone-800/80 border border-stone-700 hover:border-orange-500 rounded-[3px] transition-colors group block space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-orange-400">CUSTOMER PERSONA</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-sm font-bold text-white">Naidu Reshmanth Sai</div>
              <p className="text-xs text-stone-400 leading-normal">
                Inspect registered devices, file failure reports, compare repairer bids, and view personal device passports.
              </p>
            </Link>

            <Link
              href="/login?redirect=/repairer"
              className="p-5 bg-stone-800/80 border border-stone-700 hover:border-orange-500 rounded-[3px] transition-colors group block space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-orange-400">REPAIR SPECIALIST</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-sm font-bold text-white">Priya Sharma</div>
              <p className="text-xs text-stone-400 leading-normal">
                Access technician workbench, submit itemized parts quotes, advance bench lifecycle states, and stamp service records.
              </p>
            </Link>

            <Link
              href="/login?redirect=/overview"
              className="p-5 bg-stone-800/80 border border-stone-700 hover:border-orange-500 rounded-[3px] transition-colors group block space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-orange-400">ADMINISTRATOR</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-sm font-bold text-white">System Admin</div>
              <p className="text-xs text-stone-400 leading-normal">
                Full platform visibility across all user registries, open tickets, laboratory certifications, and database telemetry.
              </p>
            </Link>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/report">
              <Button variant="primary" size="lg" icon={<Wrench className="w-4 h-4" />}>
                Diagnose a Hardware Issue
              </Button>
            </Link>
            <Link href="/overview">
              <Button variant="secondary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Go to Overview Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
