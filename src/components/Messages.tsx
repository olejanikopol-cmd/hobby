'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { getHost } from '@/data/hosts';
import { actions, useAppState } from '@/lib/store';
import { timeLabel } from '@/lib/time';

export function Messages() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { threads } = useAppState();
  const to = params.get('to');
  const ids = Array.from(new Set([...(to ? [to] : []), ...Object.keys(threads)]));
  const current = to ?? ids[0] ?? null;
  const host = current ? getHost(current) : undefined;
  const msgs = current ? threads[current] ?? [] : [];
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs.length]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || !current) return;
    actions.sendMessage(current, t);
    setDraft('');
  };

  return (
    <main className="bg-surface">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-7 sm:px-6">
        <h1 className="font-head text-3xl font-extrabold">Повідомлення</h1>
        {ids.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-6 py-14 text-center">
            <p className="text-muted">Поки немає розмов. Напишіть ведучому зі сторінки заняття.</p>
            <Link href="/map" className="btn-primary">До карти</Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-stretch gap-4">
            <nav aria-label="Розмови" className="flex w-full flex-col gap-1 rounded-[24px] bg-white p-3 md:w-[280px]">
              {ids.map((id) => {
                const h = getHost(id);
                const last = threads[id]?.at(-1);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => router.replace(`${pathname}?to=${id}`, { scroll: false })}
                    aria-current={id === current ? 'page' : undefined}
                    className={`flex flex-col items-start gap-0.5 rounded-2xl p-3 text-left ${id === current ? 'bg-brand-soft' : 'hover:bg-surface'}`}
                  >
                    <span className="font-extrabold">{h?.name ?? 'Ведучий'}</span>
                    <span className="w-full truncate text-[13px] text-muted">{last ? `Ви: ${last.text}` : h?.role}</span>
                  </button>
                );
              })}
            </nav>
            <section aria-label="Розмова" className="flex min-h-[520px] min-w-0 flex-[999_1_480px] flex-col overflow-hidden rounded-[24px] bg-white">
              <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold">{host?.name ?? 'Ведучий'}</div>
                  <div className="text-[13px] text-muted">{host?.role}</div>
                </div>
                {host && <Link href={`/h/${host.slug}`} className="btn h-10 bg-brand-soft px-4 text-sm text-brand-dark">Профіль</Link>}
              </div>
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[#FBFCFB] p-5">
                <p className="mx-auto max-w-sm rounded-2xl bg-amber-soft px-4 py-2 text-center text-xs text-amber-ink">
                  Демо-режим: повідомлення зберігаються у вашому браузері. Доставку ведучому підключимо разом із сервером.
                </p>
                {msgs.map((m) => (
                  <div key={m.id} className="flex max-w-[75%] animate-pop flex-col items-end gap-0.5 self-end">
                    <span className="rounded-[18px_18px_4px_18px] bg-brand px-3.5 py-2.5 text-[15px] text-white">{m.text}</span>
                    <span className="text-[11px] text-muted">{timeLabel(new Date(m.at))}</span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex flex-wrap gap-1.5 px-5 pt-2.5">
                {['Добрий день! Є вільні місця?', 'Що взяти з собою?', 'Можу запізнитися на 10 хв'].map((q) => (
                  <button key={q} type="button" onClick={() => send(q)} className="h-9 rounded-full border-[1.5px] border-line-strong px-3 text-[13px] font-semibold hover:border-brand">
                    {q}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
                className="flex items-center gap-2 px-5 pt-3 pb-4"
              >
                <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Повідомлення" placeholder="Напиши повідомлення…" className="field h-12 flex-1 rounded-full px-4" />
                <button type="submit" aria-label="Надіслати" disabled={!draft.trim()} className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40">
                  <Icon name="send" />
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
