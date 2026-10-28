'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Cover, FavoriteButton } from './ActivityBits';
import { Icon } from './Icon';
import { getHost } from '@/data/hosts';
import { getCategory } from '@/lib/categories';
import { pinLabel, priceLabel, spotsLeft } from '@/lib/format';
import { downloadIcs } from '@/lib/ics';
import { sanitizeHtml } from '@/lib/sanitize';
import { actions, findActivity, isBooked, useActivities, useAppState, useHydrated } from '@/lib/store';
import { dayLabel, scheduleLabel, sessionLabel, timeLabel, upcomingSessions } from '@/lib/time';
import type { Activity, Session } from '@/lib/types';

const KyivMap = dynamic(() => import('./KyivMap'), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#EEF2EE]" /> });

export function ActivityView({ slug, initial }: { slug: string; initial?: Activity }) {
  const all = useActivities();
  const hydrated = useHydrated();
  const activity = initial ?? findActivity(all, slug);

  if (!activity) {
    if (!hydrated) return <div className="mx-auto h-[60vh] max-w-[1200px] animate-pulse" />;
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-head text-3xl font-extrabold">Заняття не знайдено</h1>
        <p className="text-muted">Можливо, ведучий його прибрав або посилання з помилкою.</p>
        <Link href="/map" className="btn-primary">До карти</Link>
      </main>
    );
  }
  return <ActivityPage activity={activity} />;
}

function ActivityPage({ activity: a }: { activity: Activity }) {
  const router = useRouter();
  const state = useAppState();
  const hydrated = useHydrated();
  const host = getHost(a.hostSlug);
  const hostName = host?.name ?? (a.createdByUser ? state.user?.name ?? 'Ви' : 'Ведучий');
  const cat = getCategory(a.categoryId);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const sessions = useMemo(() => (now ? upcomingSessions(a, now, 4) : []), [a, now]);
  const [pickedIdx, setPickedIdx] = useState(0);
  const picked: Session | undefined = sessions[pickedIdx] ?? sessions[0];
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<Session | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const left = spotsLeft(a);
  const alreadyBooked = hydrated && picked ? isBooked(state, a.slug, picked.start) : false;
  const anyBooking = hydrated && state.bookings.some((b) => b.slug === a.slug && b.status === 'booked');
  const html = useMemo(() => sanitizeHtml(a.descriptionHtml), [a.descriptionHtml]);

  const startBooking = () => {
    if (!picked) return;
    if (!state.user) {
      router.push(`/login?next=${encodeURIComponent(`/a/${a.slug}`)}`);
      return;
    }
    setConfirm(true);
  };
  const confirmBooking = () => {
    if (!picked) return;
    actions.book(a.slug, picked.start);
    setConfirm(false);
    setDone(picked);
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: a.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg('Посилання скопійовано');
    } catch {
      setShareMsg('Не вдалося поділитися');
    }
    setTimeout(() => setShareMsg(null), 2500);
  };

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pt-5 pb-28 sm:px-6 lg:pb-16">
      <nav aria-label="Ви тут" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/map" className="font-semibold text-brand hover:underline">Карта Києва</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/map?when=week&cat=${a.categoryId}`} className="font-semibold text-brand hover:underline">{cat?.label}</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/map?when=week&cat=${a.categoryId}&sub=${encodeURIComponent(a.sub)}`} className="hover:underline">{a.sub}</Link>
      </nav>

      <div className="flex animate-rise flex-col gap-3.5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand px-3 py-1.5 text-[13px] font-extrabold text-white">{a.format}</span>
          {[a.district, ...a.audience].map((t) => (
            <span key={t} className="rounded-full bg-chip px-3 py-1.5 text-[13px] font-bold">{t}</span>
          ))}
        </div>
        <h1 className="max-w-[860px] font-head text-3xl leading-tight font-bold tracking-[-0.01em] sm:text-[40px]">{a.title}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-ink-2">
          <span className="flex items-center gap-2">
            <Icon name="user" size={18} className="text-brand" />
            Веде{' '}
            {host ? (
              <Link href={`/h/${host.slug}`} className="font-extrabold text-brand hover:underline">{hostName}</Link>
            ) : (
              <b className="text-brand">{hostName}</b>
            )}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="calendar" size={18} className="text-brand" />
            {sessions[0] && now ? sessionLabel(sessions[0], now) : scheduleLabel(a.schedule)}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="pin" size={18} className="text-brand" />
            {a.district}
          </span>
        </div>
      </div>

      <Cover activity={a} size="lg" className="h-[200px] rounded-[26px] sm:h-[280px]" />

      <div className="flex flex-wrap items-start gap-12">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-9">
          <section className="flex flex-col gap-3">
            <h2 className="font-head text-[22px] font-bold">Про заняття</h2>
            <div className="rich text-[17px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
          </section>

          {a.program && a.program.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <h2 className="font-head text-[22px] font-bold">Що буде</h2>
              <ol className="flex flex-col gap-2.5">
                {a.program.map((p, i) => (
                  <li key={p.title} className="flex items-center gap-3.5 rounded-2xl bg-surface px-4 py-3.5">
                    <span aria-hidden="true" className="w-8 shrink-0 font-head text-2xl font-extrabold text-brand">{i + 1}</span>
                    <span className="flex-1 font-semibold">{p.title}</span>
                    <span className="text-sm text-muted">{p.minutes} хв</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {a.includes && a.includes.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <h2 className="font-head text-[22px] font-bold">Що включено</h2>
              <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {a.includes.map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Icon name="check" className="shrink-0 text-brand" stroke={2.4} />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-3.5">
            <h2 className="font-head text-[22px] font-bold">Де</h2>
            <div className="flex flex-wrap items-center gap-5 rounded-card border border-line p-3.5">
              <KyivMap
                compact
                pins={[{ id: a.slug, lat: a.lat, lng: a.lng, label: pinLabel(a), title: a.title, tone: a.priceType }]}
                selectedId={a.slug}
                className="relative h-[180px] min-w-[220px] flex-[1_1_260px] rounded-[14px]"
              />
              <div className="flex flex-[1_1_220px] flex-col gap-1.5">
                <span className="text-[17px] font-bold">{a.district}</span>
                {anyBooking ? (
                  <span className="text-[15px]">Точна адреса: <b>{a.address}</b></span>
                ) : (
                  <span className="text-[15px] text-muted">Точну адресу покажемо після запису.</span>
                )}
                <Link href={`/map?when=week&sel=${a.slug}`} className="mt-1 font-bold text-brand hover:underline">Показати на карті</Link>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3.5">
            <h2 className="font-head text-[22px] font-bold">Ведучий</h2>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-5 rounded-[26px] bg-brand p-7 text-white">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
                <span className="font-head text-[28px] leading-tight font-extrabold">{hostName}</span>
                {host && <span className="font-semibold text-[#CFE6D8]">{host.role}</span>}
                {host && <span className="mt-1.5 leading-relaxed text-[#E9F3EC]">{host.bio}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {host && <Link href={`/h/${host.slug}`} className="btn h-12 bg-white px-5 text-brand-dark hover:bg-brand-soft">Профіль</Link>}
                <Link href={`/messages?to=${a.hostSlug}`} className="btn h-12 border-[1.5px] border-white/50 px-5 text-white hover:bg-white/10">Написати</Link>
              </div>
            </div>
          </section>
        </div>

        <aside aria-label="Запис на заняття" className="w-full min-w-0 flex-[1_1_340px] lg:sticky lg:top-24">
          <div className="flex flex-col gap-4 rounded-[24px] border border-line bg-white p-6 shadow-card">
            {done ? (
              <div className="flex animate-pop flex-col gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Icon name="check" size={26} stroke={2.6} />
                </span>
                <h2 className="font-head text-2xl font-extrabold">Ви записані!</h2>
                <p className="text-[15px] text-ink-2">
                  {now ? dayLabel(done.start, now) : ''}, {timeLabel(done.start)}. Адреса: <b>{a.address}</b>. Оплата на місці — {priceLabel(a).toLowerCase()}.
                </p>
                <button type="button" onClick={() => downloadIcs(a, done)} className="btn-ghost">
                  <Icon name="download" size={18} />
                  Додати в календар
                </button>
                <Link href="/me" className="btn-primary">Мої записи</Link>
                <button type="button" className="text-sm font-bold text-brand" onClick={() => setDone(null)}>Записатися на іншу дату</button>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-head text-3xl font-bold">{priceLabel(a)}</span>
                  {a.priceType === 'paid' && a.priceUnit === 'visit' && <span className="text-muted">за людину</span>}
                </div>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-extrabold">Оберіть дату</legend>
                  {!now && Array.from({ length: 3 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-surface" />)}
                  {now && sessions.length === 0 && <p className="text-sm text-muted">Найближчих дат поки немає.</p>}
                  {now &&
                    sessions.map((s, i) => {
                      const on = i === pickedIdx;
                      return (
                        <label
                          key={s.start.toISOString()}
                          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-3.5 py-2.5 ${on ? 'border-brand bg-surface' : 'border-line hover:border-line-strong'}`}
                        >
                          <input type="radio" name="session" checked={on} onChange={() => setPickedIdx(i)} className="h-[18px] w-[18px] accent-brand" />
                          <span className="flex flex-1 flex-col">
                            <span className="text-[15px] font-bold">{dayLabel(s.start, now)}</span>
                            <span className="text-[13px] text-muted">
                              {timeLabel(s.start)}–{timeLabel(s.end)}
                            </span>
                          </span>
                          <span className={`text-[13px] font-bold ${left <= 2 ? 'text-[#8A5A00]' : 'text-brand-dark'}`}>
                            {left === 0 ? 'Місць немає' : left <= 2 ? `Залишилось ${left}` : `${left} місць`}
                          </span>
                        </label>
                      );
                    })}
                </fieldset>
                {alreadyBooked ? (
                  <Link href="/me" className="btn h-14 bg-brand-soft text-[17px] text-brand-dark">
                    <Icon name="check" stroke={2.6} /> Ви вже записані
                  </Link>
                ) : (
                  <button type="button" onClick={startBooking} disabled={!picked || left === 0} className="btn-primary h-14 text-[17px] font-extrabold">
                    Записатися
                  </button>
                )}
                <p className="text-[13px] leading-normal text-muted">Оплата на місці — готівкою або карткою. Скасувати запис можна за 24 години до початку.</p>
                <div className="flex gap-2">
                  <FavoriteButton slug={a.slug} className="h-11 w-auto flex-1 gap-2 px-4 text-sm font-bold" />
                  <button type="button" onClick={share} className="btn-ghost h-11 flex-1 text-sm">
                    <Icon name="share" size={18} />
                    Поділитися
                  </button>
                </div>
                {shareMsg && <p role="status" className="text-center text-sm font-bold text-brand">{shareMsg}</p>}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* плаваюча кнопка на телефоні */}
      {!done && picked && !alreadyBooked && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <span className="flex flex-col">
            <span className="font-head text-lg font-bold">{priceLabel(a)}</span>
            <span className="text-xs text-muted">{now ? `${dayLabel(picked.start, now)}, ${timeLabel(picked.start)}` : ''}</span>
          </span>
          <button type="button" onClick={startBooking} disabled={left === 0} className="btn-primary ml-auto h-12 px-6">Записатися</button>
        </div>
      )}

      {confirm && picked && now && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center" onClick={() => setConfirm(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md animate-pop flex-col gap-4 rounded-[28px] bg-white p-6 shadow-float"
          >
            <h2 id="confirm-title" className="font-head text-2xl font-extrabold">Підтвердіть запис</h2>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[15px]">
              <dt className="text-muted">Заняття</dt>
              <dd className="font-bold">{a.title}</dd>
              <dt className="text-muted">Коли</dt>
              <dd className="font-bold">{dayLabel(picked.start, now)}, {timeLabel(picked.start)}–{timeLabel(picked.end)}</dd>
              <dt className="text-muted">Де</dt>
              <dd className="font-bold">{a.district}</dd>
              <dt className="text-muted">Ціна</dt>
              <dd className="font-bold">{priceLabel(a)}, оплата на місці</dd>
            </dl>
            <p className="text-sm text-muted">Скасувати можна в «Моїх записах» за 24 години до початку.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="btn-ghost flex-1">Назад</button>
              <button type="button" onClick={confirmBooking} autoFocus className="btn-primary flex-1">Записатися</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
