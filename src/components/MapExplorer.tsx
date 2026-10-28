'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { CategoryPanel } from './CategoryPanel';
import { Cover, FavoriteButton, PriceTag } from './ActivityBits';
import { Icon } from './Icon';
import { getCategory, plural } from '@/lib/categories';
import { pinLabel } from '@/lib/format';
import { useActivities } from '@/lib/store';
import { isWhen, sessionForWhen, sessionLabel, WHEN_OPTIONS } from '@/lib/time';
import type { MapPin } from './KyivMap';
import type { When } from '@/lib/types';

const KyivMap = dynamic(() => import('./KyivMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#EEF2EE]" />,
});

const QUICK = [
  ['craft', 'Ремесла'],
  ['martial', 'Єдиноборства'],
  ['dance', 'Танці'],
  ['psy', 'Психологія'],
  ['breath', 'Дихання'],
  ['games', 'Ігри'],
] as const;

const HEAD: Record<When, string> = {
  now: 'Починається зараз',
  today: 'Сьогодні в Києві',
  tomorrow: 'Завтра в Києві',
  weekend: 'На вихідних',
  week: 'Цього тижня',
  always: 'Працюють постійно',
  date: 'На обрану дату',
};

/** «Зараз» оновлюємо щохвилини, щоб фільтр «Зараз» був чесним. */
function subscribeMinute(cb: () => void) {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
}
const getMinute = () => Math.floor(Date.now() / 60_000);

export function MapExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const all = useActivities();
  const minute = useSyncExternalStore(subscribeMinute, getMinute, getMinute);
  const now = useMemo(() => new Date(minute * 60_000), [minute]);

  const rawWhen = params.get('when');
  const explicitWhen = isWhen(rawWhen);
  // Пізно ввечері на «Сьогодні» вже нічого — тоді без явного вибору показуємо тиждень.
  const todayEmpty = useMemo(() => !explicitWhen && all.every((a) => !sessionForWhen(a, 'today', now)), [explicitWhen, all, now]);
  const when: When = explicitWhen ? (rawWhen as When) : todayEmpty ? 'week' : 'today';
  const date = params.get('date') ?? undefined;
  const cat = params.get('cat') ?? 'all';
  const sub = params.get('sub');
  const free = params.get('free') === '1';
  const q = params.get('q') ?? '';
  const sel = params.get('sel');

  const [panel, setPanel] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const inTime = useMemo(
    () =>
      all
        .map((a) => ({ a, session: sessionForWhen(a, when, now, date) }))
        .filter((x): x is { a: typeof x.a; session: NonNullable<typeof x.session> } => x.session !== null),
    [all, when, now, date],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const { a } of inTime) m.set(a.sub, (m.get(a.sub) ?? 0) + 1);
    return m;
  }, [inTime]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return inTime
      .filter(({ a }) => (cat === 'all' || a.categoryId === cat) && (!sub || a.sub === sub))
      .filter(({ a }) => !free || a.priceType !== 'paid')
      .filter(({ a }) => !needle || `${a.title} ${a.sub} ${a.district} ${getCategory(a.categoryId)?.label ?? ''}`.toLowerCase().includes(needle))
      .sort((x, y) => x.session.start.getTime() - y.session.start.getTime());
  }, [inTime, cat, sub, free, q]);

  const selected = list.find((x) => x.a.slug === sel) ?? null;
  const pins: MapPin[] = useMemo(
    () => list.map(({ a }) => ({ id: a.slug, lat: a.lat, lng: a.lng, label: pinLabel(a), title: a.title, tone: a.priceType })),
    [list],
  );

  const n = list.length;
  const activeCat = cat !== 'all' ? getCategory(cat) : undefined;

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col">
      <section aria-label="Фільтри" className="relative z-30 flex flex-col gap-2.5 border-b border-line bg-white px-4 py-3 sm:px-6">
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {WHEN_OPTIONS.map((w) => {
            const on = when === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setParams({ when: w.id, date: null, sel: null })}
                aria-pressed={on}
                className={`chip shrink-0 ${on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white hover:border-brand'}`}
              >
                {w.id === 'now' && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber shadow-[0_0_0_3px_rgba(240,178,62,0.3)]" />}
                {w.label}
              </button>
            );
          })}
          <label className={`chip relative shrink-0 cursor-pointer border-dashed ${when === 'date' ? 'border-brand bg-brand-soft' : 'border-[#B9C9BF] bg-white'}`}>
            <Icon name="calendar" size={16} />
            <span className="sr-only">Обрати дату</span>
            <input
              type="date"
              value={when === 'date' ? date ?? '' : ''}
              onChange={(e) => setParams({ when: e.target.value ? 'date' : 'today', date: e.target.value || null, sel: null })}
              className="w-[8.5rem] bg-transparent text-sm font-semibold outline-none"
            />
          </label>
        </div>

        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setPanel((v) => !v)}
            aria-expanded={panel}
            className="flex h-11 shrink-0 items-center gap-2 rounded-control bg-ink px-4 text-sm font-bold text-white"
          >
            <Icon name="grid" size={16} />
            Усі категорії
            <Icon name="chevronDown" size={14} className={`transition-transform ${panel ? 'rotate-180' : ''}`} />
          </button>
          {(sub || (activeCat && !QUICK.some(([id]) => id === cat))) && (
            <span className="flex h-11 shrink-0 items-center gap-1 rounded-control bg-brand-soft pr-1 pl-3.5 text-sm font-bold text-brand-dark">
              {activeCat?.label}
              {sub ? ` › ${sub}` : ''}
              <button type="button" onClick={() => setParams({ cat: null, sub: null })} aria-label="Скинути категорію" className="flex h-9 w-9 items-center justify-center rounded-lg">
                <Icon name="close" size={14} />
              </button>
            </span>
          )}
          {QUICK.map(([id, label]) => {
            const on = cat === id && !sub;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setParams({ cat: on ? null : id, sub: null, sel: null })}
                aria-pressed={on}
                className={`h-11 shrink-0 rounded-control px-4 text-sm font-semibold ${on ? 'bg-brand text-white' : 'bg-chip hover:bg-brand-soft'}`}
              >
                {label}
              </button>
            );
          })}
          <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line" />
          <button
            type="button"
            onClick={() => setParams({ free: free ? null : '1' })}
            aria-pressed={free}
            className="flex h-11 shrink-0 items-center gap-2.5 rounded-control bg-chip px-3.5 text-sm font-semibold"
          >
            <span aria-hidden="true" className={`block h-5 w-9 rounded-full p-0.5 transition-colors ${free ? 'bg-brand' : 'bg-[#C9D6CE]'}`}>
              <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${free ? 'translate-x-4' : ''}`} />
            </span>
            Лише безкоштовні
          </button>
        </div>
        {panel && (
          <CategoryPanel
            activeCat={cat}
            activeSub={sub}
            counts={counts}
            onClose={() => setPanel(false)}
            onPick={(c, s) => {
              setParams({ cat: c, sub: s, sel: null });
              setPanel(false);
            }}
          />
        )}
      </section>

      <div className="relative flex min-h-0 flex-1 bg-surface">
        <section
          aria-label="Список занять"
          className={`${view === 'list' ? 'flex' : 'hidden'} w-full flex-col gap-3 overflow-y-auto border-r border-line bg-white p-4 md:flex md:w-[440px] md:shrink-0 lg:w-[480px]`}
        >
          <label className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4">
            <Icon name="search" size={17} className="text-muted" />
            <input
              type="search"
              defaultValue={q}
              onChange={(e) => setParams({ q: e.target.value || null })}
              aria-label="Пошук по заняттях"
              placeholder="Гончарство, бокс, Поділ…"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </label>
          {todayEmpty && (
            <p className="rounded-control bg-amber-soft px-3 py-2 text-sm text-amber-ink">На сьогодні вже все завершилось — показуємо найближчий тиждень.</p>
          )}
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-head text-xl font-bold">{HEAD[when]}</h1>
            <span className="text-sm font-semibold whitespace-nowrap text-muted">
              {n} {plural(n, 'заняття', 'заняття', 'занять')}
            </span>
          </div>
          {n === 0 && (
            <div className="rounded-card bg-surface px-5 py-8 text-center text-[15px] leading-relaxed text-muted">
              Нічого не знайшли за цими фільтрами.
              <br />
              <button type="button" className="mt-3 font-bold text-brand" onClick={() => setParams({ when: 'week', cat: null, sub: null, free: null, q: null, date: null })}>
                Показати все за тиждень
              </button>
            </div>
          )}
          {list.map(({ a, session }, i) => {
            const on = selected?.a.slug === a.slug;
            return (
              <article
                key={a.slug}
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                className={`flex shrink-0 animate-rise gap-3.5 rounded-card border-[1.5px] bg-white p-3 ${on ? 'border-brand shadow-card' : 'border-line'}`}
              >
                <Cover activity={a} size="sm" className="w-[96px] shrink-0 rounded-[14px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-extrabold tracking-[0.05em] text-brand uppercase">{a.format}</span>
                    <PriceTag activity={a} />
                  </div>
                  <h2 className="text-base leading-snug font-bold">{a.title}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <Icon name="clock" size={15} />
                    {sessionLabel(session, now)}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <Icon name="pin" size={15} />
                    {a.district}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setParams({ sel: a.slug });
                        setView('map');
                      }}
                      className="btn-ghost h-10 px-4 text-sm"
                    >
                      На карті
                    </button>
                    <Link href={`/a/${a.slug}`} className="btn h-10 bg-brand-soft px-4 text-sm text-brand-dark hover:bg-[#D3E6DA]">
                      Детальніше
                    </Link>
                    <FavoriteButton slug={a.slug} className="h-10 w-10" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section aria-label="Карта Києва" className={`${view === 'map' ? 'block' : 'hidden'} relative min-w-0 flex-1 md:block`}>
          <KyivMap pins={pins} selectedId={selected?.a.slug ?? null} onSelect={(id) => setParams({ sel: id })} className="absolute inset-0" />
          {selected && (
            <div className="absolute inset-x-3 bottom-3 z-10 flex animate-pop gap-3.5 rounded-section bg-white p-3.5 shadow-float sm:right-auto sm:left-4 sm:w-[420px]">
              <Cover activity={selected.a} size="sm" className="w-[88px] shrink-0 rounded-[14px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold tracking-[0.05em] text-brand uppercase">
                    {selected.a.format}, {selected.a.district}
                  </span>
                  <button type="button" onClick={() => setParams({ sel: null })} aria-label="Закрити картку" className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-chip">
                    <Icon name="close" size={14} />
                  </button>
                </div>
                <h3 className="text-base leading-snug font-bold">{selected.a.title}</h3>
                <p className="text-sm text-muted">{sessionLabel(selected.session, now)}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <PriceTag activity={selected.a} />
                  <Link href={`/a/${selected.a.slug}`} className="btn-primary h-10 text-sm">
                    Записатися
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
          className="btn-dark absolute bottom-4 left-1/2 z-20 -translate-x-1/2 shadow-float md:hidden"
          style={{ display: view === 'map' && selected ? 'none' : undefined }}
        >
          <Icon name={view === 'list' ? 'map' : 'list'} size={18} />
          {view === 'list' ? 'Карта' : 'Список'}
        </button>
      </div>
    </div>
  );
}
