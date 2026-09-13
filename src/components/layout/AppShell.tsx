'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell manages structural layout constraints based on active route.
 * Root route ('/') receives full viewport width for landing page sections,
 * while internal application routes receive the standard editorial container.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <main id="main-content" className="flex-1 w-full flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {children}
    </main>
  );
}
