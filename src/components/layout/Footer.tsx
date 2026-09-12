import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-[#F5F5F4] text-stone-600 text-xs py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 tracking-tight text-sm">
                RepairGraph
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-[2px]">
                PROTOTYPE
              </span>
            </div>
            <p className="text-stone-500 text-xs max-w-md leading-relaxed">
              An intelligent product repair and lifecycle evaluation platform.
              Synthesizing symptom diagnosis, repairability scoring, fair-market economics, and standardized service records.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-stone-900 font-semibold">
              Policy & Frameworks
            </div>
            <ul className="space-y-1 text-xs text-stone-500">
              <li>
                <a
                  href="https://righttorepairindia.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 inline-block hover:text-stone-900 underline underline-offset-2 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]"
                >
                  Right to Repair India Portal
                </a>
              </li>
              <li>
                <a
                  href="https://commission.europa.eu/law/law-topic/consumer-protection-law/directive-repair-goods_en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 inline-block hover:text-stone-900 underline underline-offset-2 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]"
                >
                  EU Repair of Goods Directive
                </a>
              </li>
              <li>
                <a
                  href="https://ewastemonitor.info/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 inline-block hover:text-stone-900 underline underline-offset-2 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]"
                >
                  Global E-Waste Monitor (UNITAR)
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-stone-900 font-semibold">
              Navigation
            </div>
            <nav aria-label="Footer Navigation">
              <ul className="space-y-1 text-xs text-stone-500">
                <li>
                  <Link href="/devices" className="py-1 inline-block hover:text-stone-900 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]">
                    Devices
                  </Link>
                </li>
                <li>
                  <Link href="/report" className="py-1 inline-block hover:text-stone-900 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]">
                    Diagnose / Report
                  </Link>
                </li>
                <li>
                  <Link href="/repairs" className="py-1 inline-block hover:text-stone-900 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]">
                    Repairs
                  </Link>
                </li>
                <li>
                  <Link href="/passport" className="py-1 inline-block hover:text-stone-900 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]">
                    Passport
                  </Link>
                </li>
                <li>
                  <Link href="/repairers" className="py-1 inline-block hover:text-stone-900 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-[2px]">
                    Specialists
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-baseline justify-between gap-2 text-[11px] text-stone-400">
          <div>
            Data shown includes sample hardware records and public benchmark pricing.
          </div>
          <div className="font-mono">
            RepairGraph Platform // Phase 1 Foundation
          </div>
        </div>
      </div>
    </footer>
  );
}
