'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ActivityTile } from './ActivityBits';
import { useActivities, useHydrated } from '@/lib/store';
import { sessionForWhen, sessionLabel } from '@/lib/time';

export function TodayRail() {
  const all = useActivities();
  const hydrated = useHydrated();
  const items = useMemo(() => {
    if (!hydrated) return [];
    const now = new Date();
    return all
      .map((a) => ({ a, s: sessionForWhen(a, 'today', now) ?? sessionForWhen(a, 'tomorrow', now) }))
      .filter((x): x is { a: (typeof all)[number]; s: NonNullable<typeof x.s> } => !!x.s)
      .sort((x, y) => x.s.start.getTime() - y.s.start.getTime())
      .slice(0, 8)
      .map(({ a, s }) => ({ a, label: `${sessionLabel(s, now)}, ${a.district}` }));
  }, [all, hydrated]);

  return (
    <section className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 pt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-head text-4xl font-extrabold">Сьогодні і завтра</h2>
        <Link href="/map?when=today" className="font-bold text-brand hover:underline">
          Усе на карті →
        </Link>
      </div>
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
        {!hydrated &&
          Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[330px] w-[280px] shrink-0 animate-pulse rounded-card bg-surface" />)}
        {items.map(({ a, label }) => (
          <div key={a.slug} className="w-[280px] shrink-0 snap-start">
            <ActivityTile activity={a} meta={label} />
          </div>
        ))}
      </div>
    </section>
  );
}
