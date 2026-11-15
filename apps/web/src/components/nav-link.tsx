'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Enlace con estado activo. Los enlaces con ancla (#) nunca figuran como activos. */
export function NavLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active =
    !href.includes('#') && (href === '/' ? pathname === '/' : pathname.startsWith(href));
  return (
    <a
      href={href}
      className={className}
      aria-label={label}
      title={label}
      {...(active ? { 'aria-current': 'page' as const } : {})}
    >
      {children}
      <span className="nav-label">{label}</span>
    </a>
  );
}
