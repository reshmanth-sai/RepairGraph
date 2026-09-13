'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Menu, X, LogIn } from 'lucide-react';

import { useFocusTrap } from '@/lib/useFocusTrap';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const mobileDrawerRef = useFocusTrap<HTMLElement>({
    isOpen: mobileMenuOpen,
    onClose: () => setMobileMenuOpen(false),
  });

  // Role-aware navigation hierarchy
  const navLinks = (() => {
    if (user?.role === 'REPAIRER') {
      return [
        { href: '/overview', label: 'Overview' },
        { href: '/repairer', label: 'Workbench' },
        { href: '/repairers', label: 'Specialists' },
        { href: '/passport', label: 'Passport' },
        { href: '/repairs', label: 'Repairs' },
        { href: '/devices', label: 'Devices' },
      ];
    }
    if (user?.role === 'ADMIN') {
      return [
        { href: '/overview', label: 'Overview' },
        { href: '/devices', label: 'Devices' },
        { href: '/report', label: 'Diagnose' },
        { href: '/repairs', label: 'Repairs' },
        { href: '/passport', label: 'Passport' },
        { href: '/repairers', label: 'Specialists' },
        { href: '/repairer', label: 'Workbench' },
      ];
    }
    // Default: Customer (USER) or unauthenticated guest
    return [
      { href: '/overview', label: 'Overview' },
      { href: '/devices', label: 'Devices' },
      { href: '/report', label: 'Diagnose' },
      { href: '/repairs', label: 'Repairs' },
      { href: '/passport', label: 'Passport' },
      { href: '/repairers', label: 'Specialists' },
    ];
  })();

  // Path-segment-aware matching (prevents /repairers from activating /repairer)
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const loginRedirectHref =
    pathname && pathname !== '/login'
      ? `/login?redirect=${encodeURIComponent(pathname)}`
      : '/login';

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
            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3 py-1.5 text-xs rounded-[2px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900 ${
                      active
                        ? 'text-stone-950 font-semibold bg-stone-200/60 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action: User Session Status + Primary Action */}
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
                  className="px-2 py-1 text-[11px] font-mono text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 rounded-[2px] border border-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href={loginRedirectHref}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-[2px] border border-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
              >
                <LogIn className="w-3 h-3 text-stone-500" />
                Sign In
              </Link>
            )}

            {user?.role === 'REPAIRER' ? (
              <Link
                href="/repairer"
                aria-current={isActive('/repairer') ? 'page' : undefined}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900 ${
                  isActive('/repairer')
                    ? 'bg-orange-700 text-white'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                Workbench
              </Link>
            ) : (
              <Link
                href="/report"
                aria-current={isActive('/report') ? 'page' : undefined}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-orange-700 active:bg-orange-800 rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
              >
                Report a Problem
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            {user?.role === 'REPAIRER' ? (
              <Link
                href="/repairer"
                className="px-2.5 py-1 text-xs font-semibold text-white bg-stone-900 rounded-[3px]"
              >
                Workbench
              </Link>
            ) : (
              <Link
                href="/report"
                className="px-2.5 py-1 text-xs font-semibold text-white bg-stone-900 rounded-[3px]"
              >
                Report
              </Link>
            )}
            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-stone-700 hover:text-stone-900 border border-stone-200 rounded-[3px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-900"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          ref={mobileDrawerRef}
          id="mobile-navigation"
          aria-label="Mobile Navigation"
          className="sm:hidden border-b border-stone-200 bg-white px-4 py-3 space-y-1"
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  setMobileMenuOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className={`min-h-[44px] flex items-center px-3 py-2 text-xs rounded-[2px] transition-colors ${
                  active
                    ? 'text-stone-950 bg-stone-100 font-semibold border-l-2 border-stone-900 pl-2.5'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full min-h-[44px]">
                <span className="text-xs font-semibold text-stone-800">
                  {user.name} ({user.role})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    menuButtonRef.current?.focus();
                  }}
                  className="min-h-[44px] flex items-center text-xs text-stone-500 font-mono underline hover:text-stone-900 px-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href={loginRedirectHref}
                onClick={() => {
                  setMobileMenuOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="min-h-[44px] flex items-center text-xs font-semibold text-stone-900 hover:underline"
              >
                Sign In to Account →
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
