'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ActivityTile, PriceTag } from './ActivityBits';
import { Icon } from './Icon';
import { DISTRICTS } from './Onboarding';
import { CATEGORIES } from '@/lib/categories';
import { downloadIcs } from '@/lib/ics';
import { actions, findActivity, useActivities, useAppState, type Booking } from '@/lib/store';
import { dayLabel, durationMinutes, scheduleLabel, timeLabel } from '@/lib/time';

const TABS = [
  ['bookings', 'Мої записи'],
  ['favorites', 'Обране'],
  ['settings', 'Налаштування'],
] as const;
type Tab = (typeof TABS)[number][0];

export function Cabinet() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get('tab');
  const tab: Tab = TABS.some(([id]) => id === raw) ? (raw as Tab) : 'bookings';
  const state = useAppState();
  const all = useActivities();
  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });
  const active = state.bookings.filter((b) => b.status === 'booked').length;

  return (
    <main className="bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-7 px-4 py-8 sm:px-6">
        <nav aria-label="Кабінет" className="flex w-full flex-col gap-1 rounded-[24px] bg-white p-4 md:w-[260px]">
          <div className="flex items-center gap-3 px-2 pt-2 pb-4">
            <div className="min-w-0">
              <div className="truncate font-extrabold">{state.user?.name}</div>
              <div className="truncate text-[13px] text-muted">{state.user?.email}</div>
            </div>
          </div>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-left font-bold ${tab === id ? 'bg-brand-soft text-brand-dark' : 'hover:bg-surface'}`}
            >
              {label}
              <span className="text-[13px] font-semibold text-muted">
                {id === 'bookings' ? active || '' : id === 'favorites' ? state.favorites.length || '' : ''}
              </span>
            </button>
          ))}
          <Link href="/messages" className="flex min-h-11 items-center rounded-xl px-3 font-bold hover:bg-surface">Повідомлення</Link>
          <span aria-hidden="true" className="my-2.5 h-px bg-line" />
          <Link href={state.created.length ? '/host' : '/host/new'} className="flex flex-col gap-1 rounded-2xl bg-brand p-3.5 text-white hover:bg-brand-dark">
            <span className="font-wave text-lg font-bold text-amber">Режим ведучого</span>
            <span className="text-sm leading-snug text-[#E4EFE8]">{state.created.length ? 'Мої заняття і записи' : 'Створи заняття і зʼявись на карті'}</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              actions.signOut();
              router.push('/');
            }}
            className="mt-1 flex min-h-11 items-center gap-2 rounded-xl px-3 text-left font-semibold text-muted hover:bg-surface"
          >
            <Icon name="logout" size={18} />
            Вийти
          </button>
        </nav>

        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          {tab === 'bookings' && <Bookings bookings={state.bookings} all={all} />}
          {tab === 'favorites' && (
            <>
              <h1 className="font-head text-4xl font-extrabold">Обране</h1>
              {state.favorites.length === 0 ? (
                <Empty text="Тисніть сердечко на занятті — і воно зʼявиться тут." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {state.favorites
                    .map((slug) => findActivity(all, slug))
                    .filter((a) => !!a)
                    .map((a) => (
                      <ActivityTile key={a!.slug} activity={a!} meta={`${scheduleLabel(a!.schedule)}, ${a!.district}`} />
                    ))}
                </div>
              )}
            </>
          )}
          {tab === 'settings' && <Settings />}
        </div>
      </div>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-6 py-12 text-center">
      <p className="text-muted">{text}</p>
      <Link href="/map" className="btn-primary">Знайти заняття</Link>
    </div>
  );
}

function Bookings({ bookings, all }: { bookings: Booking[]; all: ReturnType<typeof useActivities> }) {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const now = useMemo(() => new Date(), []);
  const rows = bookings
    .map((b) => ({ b, a: findActivity(all, b.slug), start: new Date(b.start) }))
    .filter((r) => !!r.a)
    .filter((r) =>
      filter === 'cancelled' ? r.b.status === 'cancelled' : r.b.status === 'booked' && (filter === 'upcoming' ? r.start >= now : r.start < now),
    )
    .sort((x, y) => (filter === 'past' ? y.start.getTime() - x.start.getTime() : x.start.getTime() - y.start.getTime()));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-head text-4xl font-extrabold">Мої записи</h1>
        <div role="tablist" aria-label="Фільтр записів" className="flex gap-1 rounded-full bg-white p-1">
          {(
            [
              ['upcoming', 'Найближчі'],
              ['past', 'Минулі'],
              ['cancelled', 'Скасовані'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={`h-10 rounded-full px-4 text-sm font-bold ${filter === id ? 'bg-ink text-white' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 && <Empty text={filter === 'upcoming' ? 'Поки немає записів. Знайди щось цікаве на карті!' : 'Тут поки порожньо.'} />}
      {rows.map(({ b, a, start }) => {
        const act = a!;
        const end = new Date(start.getTime() + durationMinutes(act.schedule) * 60_000);
        const canCancel = b.status === 'booked' && start.getTime() - now.getTime() > 24 * 3_600_000;
        return (
          <article key={b.id} className="flex flex-wrap items-center gap-5 rounded-[24px] bg-white p-4">
            <div className="flex h-[84px] w-[76px] shrink-0 flex-col items-center justify-center rounded-[18px]" style={{ background: act.cover }}>
              <span className="text-xs font-extrabold text-ink-2 uppercase">{dayLabel(start, now).split(',')[0].slice(0, 3)}</span>
              <span className="font-head text-2xl leading-none font-extrabold">{timeLabel(start)}</span>
            </div>
            <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
              <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-extrabold ${b.status === 'cancelled' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand-dark'}`}>
                {b.status === 'cancelled' ? 'Скасовано' : `${dayLabel(start, now)}, ${timeLabel(start)}`}
              </span>
              <Link href={`/a/${act.slug}`} className="font-head text-xl font-bold hover:text-brand">{act.title}</Link>
              <span className="text-sm text-muted">
                {act.district}, {act.address}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PriceTag activity={act} />
              {b.status === 'booked' && start >= now && (
                <button type="button" onClick={() => downloadIcs(act, { start, end })} className="btn-ghost h-10 text-sm">
                  <Icon name="calendar" size={16} />В календар
                </button>
              )}
              {b.status === 'booked' && start >= now && (
                <button
                  type="button"
                  disabled={!canCancel}
                  title={canCancel ? undefined : 'Скасувати можна не пізніше ніж за 24 години'}
                  onClick={() => actions.cancelBooking(b.id)}
                  className="btn h-10 px-4 text-sm text-danger hover:bg-danger-soft"
                >
                  Скасувати
                </button>
              )}
              {b.status === 'cancelled' && start >= now && (
                <button type="button" onClick={() => actions.restoreBooking(b.id)} className="btn h-10 px-4 text-sm text-brand hover:bg-brand-soft">
                  Повернути
                </button>
              )}
            </div>
          </article>
        );
      })}
      {filter === 'upcoming' && rows.length > 0 && (
        <div className="flex items-start gap-3 rounded-[20px] bg-amber-soft px-5 py-4 text-[15px] text-[#4A3408]">
          <Icon name="telegram" className="mt-0.5 shrink-0" />
          <span>Нагадування в Telegram зʼявляться після підключення бота. Поки що додайте заняття в календар — він нагадає за 3 години.</span>
        </div>
      )}
    </>
  );
}

function Settings() {
  const state = useAppState();
  const [name, setName] = useState(state.user?.name ?? '');
  const [saved, setSaved] = useState(false);
  const notify = [
    ['remind', 'Нагадування за 3 години до заняття'],
    ['changes', 'Якщо ведучий переніс або скасував'],
    ['news', 'Нові заняття за моїми інтересами'],
  ] as const;
  return (
    <>
      <h1 className="font-head text-4xl font-extrabold">Налаштування</h1>
      <form
        className="flex flex-col gap-4 rounded-[24px] bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          actions.setName(name.trim() || 'Гість');
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        <div className="flex flex-wrap gap-4">
          <label className="label flex-[1_1_220px]">
            Імʼя
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
          </label>
          <label className="label flex-[1_1_220px]">
            Район
            <select value={state.district} onChange={(e) => actions.setDistrict(e.target.value)} className="field">
              {DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary self-start">{saved ? 'Збережено ✓' : 'Зберегти'}</button>
      </form>

      <div className="flex flex-col gap-3 rounded-[24px] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold">Мої інтереси</span>
          <Link href="/onboarding?next=/me?tab=settings" className="text-sm font-bold text-brand">Змінити</Link>
        </div>
        {state.interests.length === 0 ? (
          <p className="text-sm text-muted">Ще не обрано.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {state.interests.map((i) => {
              const cat = CATEGORIES.find((c) => c.subs.includes(i));
              return (
                <Link key={i} href={`/map?when=week&cat=${cat?.id ?? 'all'}&sub=${encodeURIComponent(i)}`} className="flex min-h-9 items-center rounded-full bg-chip px-3 text-sm font-semibold hover:bg-brand-soft">
                  {i}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-[24px] bg-white px-6 py-3">
        {notify.map(([key, label]) => {
          const on = state.notify[key];
          return (
            <button key={key} type="button" onClick={() => actions.toggleNotify(key)} aria-pressed={on} className="flex min-h-14 items-center gap-4 text-left font-semibold">
              <span className="flex-1">{label}</span>
              <span aria-hidden="true" className={`block h-6 w-11 rounded-full p-0.5 transition-colors ${on ? 'bg-brand' : 'bg-[#C9D6CE]'}`}>
                <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-5' : ''}`} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Link href="/legal" className="btn-ghost h-11 text-sm">Правила і конфіденційність</Link>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Видалити всі ваші дані з цього браузера?')) actions.resetAll();
          }}
          className="btn h-11 px-4 text-sm text-danger hover:bg-danger-soft"
        >
          Видалити мої дані
        </button>
      </div>
    </>
  );
}
