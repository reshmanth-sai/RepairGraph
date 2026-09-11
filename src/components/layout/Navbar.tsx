'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Menu, X, LogIn } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/devices', label: 'Devices' },
    { href: '/repairs', label: 'Repairs' },
    { href: '/passport', label: 'Repair Passport' }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAF9]/95 backdrop-blur-xs border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900 rounded-[2px]"
            >
              <div className="w-4 h-4 bg-stone-900 rounded-[2px] flex items-center justify-center text-stone-100 group-hover:bg-orange-700 transition-colors">
                <span className="font-mono text-[9px] font-bold tracking-tighter">RG</span>
              </div>
              <span className="font-semibold text-stone-900 tracking-tight text-sm">
                RepairGraph
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-xs rounded-[2px] transition-colors ${
                      active
                        ? 'text-stone-950 font-semibold bg-stone-200/60'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action: User Session Status + Report CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-stone-900 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[9px] font-mono font-medium text-stone-500 uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign out of account"
                  className="px-2 py-1 text-[11px] font-mono text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 rounded-[2px] border border-stone-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-[2px] border border-stone-200 transition-colors"
              >
                <LogIn className="w-3 h-3 text-stone-500" />
                Sign In
              </Link>
            )}

            <Link
              href="/report"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-orange-700 active:bg-orange-800 rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
            >
              Report a Problem
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/report"
              className="px-2.5 py-1 text-xs font-semibold text-white bg-stone-900 rounded-[3px]"
            >
              Report
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-stone-700 hover:text-stone-900 border border-stone-200 rounded-[3px]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-stone-200 bg-white px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-xs rounded-[2px] ${
                  active
                    ? 'text-stone-950 bg-stone-100 font-semibold'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-stone-800">
                  {user.name} ({user.role})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-stone-500 font-mono underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-stone-900 block"
              >
                Sign In to Account →
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
