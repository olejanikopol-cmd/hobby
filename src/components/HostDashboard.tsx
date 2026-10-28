'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Cover, PriceTag } from './ActivityBits';
import { Icon } from './Icon';
import { actions, useAppState } from '@/lib/store';
import { scheduleLabel, sessionLabel, upcomingSessions } from '@/lib/time';

export function HostDashboard() {
  const state = useAppState();
  const now = useMemo(() => new Date(), []);
  const mine = state.created;
  const bookingsFor = (slug: string) => state.bookings.filter((b) => b.slug === slug && b.status === 'booked').length;

  return (
    <main className="bg-surface">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="font-wave text-lg font-bold text-brand">Привіт, {state.user?.name}!</span>
            <h1 className="font-head text-4xl font-extrabold">Мої заняття</h1>
          </div>
          <Link href="/host/new" className="btn-primary h-12">
            <Icon name="plus" size={18} stroke={2.6} />
            Нове заняття
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [String(mine.length), 'занять на карті'],
            [String(mine.reduce((n, a) => n + bookingsFor(a.slug), 0)), 'записів'],
            [String(mine.reduce((n, a) => n + a.capacity, 0)), 'місць усього'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col gap-1 rounded-card bg-white p-5">
              <span className="font-head text-3xl font-extrabold">{v}</span>
              <span className="text-sm text-muted">{l}</span>
            </div>
          ))}
        </div>

        {mine.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-6 py-14 text-center">
            <h2 className="font-head text-2xl font-bold">Тут зʼявляться ваші заняття</h2>
            <p className="max-w-md text-muted">Створіть перше — воно одразу зʼявиться на карті, а записи учасників будуть тут.</p>
            <Link href="/host/new" className="btn-primary">Створити заняття</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mine.map((a) => {
              const next = upcomingSessions(a, now, 1)[0];
              return (
                <article key={a.slug} className="flex flex-wrap items-center gap-4 rounded-[22px] bg-white p-4">
                  <Cover activity={a} size="sm" className="h-[92px] w-[92px] shrink-0 rounded-[18px]" />
                  <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                    <span className="self-start rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-extrabold text-brand-dark">На карті</span>
                    <Link href={`/a/${a.slug}`} className="font-head text-lg font-bold hover:text-brand">{a.title}</Link>
                    <span className="text-sm text-muted">
                      {scheduleLabel(a.schedule)}, {a.district}
                    </span>
                    <span className="text-sm text-muted">
                      {next ? `Найближче: ${sessionLabel(next, now)}` : 'Найближчих дат немає'}, записів: {bookingsFor(a.slug)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriceTag activity={a} />
                    <Link href={`/a/${a.slug}`} className="btn-ghost h-10 text-sm">Переглянути</Link>
                    <Link href={`/map?when=week&sel=${a.slug}`} className="btn-ghost h-10 text-sm">На карті</Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Видалити «${a.title}»?`)) actions.deleteActivity(a.slug);
                      }}
                      aria-label={`Видалити ${a.title}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-danger hover:bg-danger-soft"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
