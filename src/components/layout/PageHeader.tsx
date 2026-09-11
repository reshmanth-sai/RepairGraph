import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`border-b border-stone-200 pb-6 mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-2 font-mono">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-stone-900 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-stone-900 font-medium' : ''}>{item.label}</span>
                )}
                {!isLast && <ChevronRight className="w-3 h-3 text-stone-300" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {title}
            </h1>
            {meta && <div className="inline-flex items-center">{meta}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
