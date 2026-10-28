'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState, useHydrated } from '@/lib/store';

/** Показує дітей лише після входу; інакше — запрошення увійти. */
export function RequireUser({ children, title = 'Увійдіть, щоб продовжити' }: { children: React.ReactNode; title?: string }) {
  const hydrated = useHydrated();
  const { user } = useAppState();
  const pathname = usePathname();
  if (!hydrated) return <div className="mx-auto h-[60vh] max-w-[1200px] animate-pulse" />;
  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-head text-3xl font-extrabold">{title}</h1>
        <p className="text-muted">Вхід займає хвилину — і записи, обране та налаштування будуть під рукою.</p>
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary">Увійти</Link>
      </main>
    );
  }
  return <>{children}</>;
}
