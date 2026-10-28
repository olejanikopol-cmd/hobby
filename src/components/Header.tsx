'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useAppState, useHydrated } from '@/lib/store';

const NAV = [
  { href: '/map', label: 'Карта' },
  { href: '/categories', label: 'Категорії' },
];

export function Header() {
  const pathname = usePathname();
  const { user, created } = useAppState();
  const hydrated = useHydrated();
  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Logo />
        <nav aria-label="Розділи" className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3.5 py-2 text-[15px] font-semibold ${active ? 'bg-chip text-brand' : 'text-ink hover:bg-chip'}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href={hydrated && created.length ? '/host' : '/host/new'}
            className="hidden h-11 items-center rounded-full px-3.5 text-[15px] font-bold text-brand hover:bg-chip md:flex"
          >
            {hydrated && created.length ? 'Режим ведучого' : 'Стати ведучим'}
          </Link>
          <Link href="/map" className="flex h-11 items-center rounded-full px-3 text-[15px] font-bold hover:bg-chip sm:hidden">
            Карта
          </Link>
          {hydrated && user ? (
            <Link
              href="/me"
              aria-label="Мій кабінет"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4E4D4] text-sm font-extrabold hover:ring-2 hover:ring-brand"
            >
              {initials || 'Я'}
            </Link>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary">
              Увійти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
