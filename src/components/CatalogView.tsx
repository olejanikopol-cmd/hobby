'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { AUDIENCE, CATEGORIES, FORMATS, SUBCATEGORY_COUNT, plural, searchCatalog } from '@/lib/categories';

export function CatalogView() {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchCatalog(q), [q]);
  const needle = q.trim().toLowerCase();
  const found = results.reduce((n, r) => n + r.subs.length, 0);

  return (
    <main>
      <section className="bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-6 pt-14 pb-10">
          <span className="font-wave text-lg font-bold text-brand">Каталог hobbyl</span>
          <h1 className="max-w-[820px] font-head text-4xl leading-[1.05] font-extrabold tracking-[-0.015em] sm:text-[52px]">Усі хобі Києва в одному місці</h1>
          <p className="max-w-[640px] text-lg leading-relaxed text-ink-2">
            {CATEGORIES.length} категорій і {SUBCATEGORY_COUNT} напрямів — від секції боксу до холотропного дихання. Обери напрям, і ми покажемо, де він є поруч.
          </p>
          <label className="flex h-[60px] max-w-[680px] items-center gap-3 rounded-full border-[1.5px] border-line-strong bg-white pr-2 pl-5 shadow-card">
            <Icon name="search" className="text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Пошук напряму"
              placeholder="Бокс, кераміка, холотропне дихання…"
              className="min-w-0 flex-1 bg-transparent text-[17px] outline-none"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="h-11 rounded-full bg-chip px-4 text-sm font-bold">Очистити</button>
            )}
          </label>
          <span role="status" className="text-sm font-semibold text-muted">
            {needle ? (results.length ? `Знайшли ${found} ${plural(found, 'напрям', 'напрями', 'напрямів')}` : 'Нічого не знайшли') : `${CATEGORIES.length} категорій, ${SUBCATEGORY_COUNT} напрямів`}
          </span>
          <nav aria-label="Швидкий перехід" className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <a key={c.id} href={`#cat-${c.id}`} className="flex h-9 items-center rounded-full border border-line bg-white px-3 text-[13px] font-bold hover:border-brand">
                {c.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 pt-9 pb-6">
        {results.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-section bg-surface px-6 py-10 text-center">
            <span className="font-head text-xl font-bold">Такого напряму ще немає</span>
            <span className="text-muted">Ведеш таке заняття? Створи його — і напрям зʼявиться.</span>
            <Link href="/host/new" className="btn-primary">Запропонувати заняття</Link>
          </div>
        )}
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {results.map(({ category: c, subs }) => (
            <article key={c.id} id={`cat-${c.id}`} className="mb-5 flex scroll-mt-24 break-inside-avoid flex-col gap-3.5 rounded-section p-5" style={{ background: c.tint }}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand">
                  <Icon d={c.icon} size={22} stroke={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-head text-xl leading-tight font-bold">{c.label}</h2>
                  <span className="text-[13px] text-ink-2">
                    {c.subs.length} {plural(c.subs.length, 'напрям', 'напрями', 'напрямів')}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subs.map((s) => {
                  const hit = !!needle && s.toLowerCase().includes(needle);
                  return (
                    <Link
                      key={s}
                      href={`/map?when=week&cat=${c.id}&sub=${encodeURIComponent(s)}`}
                      className={`flex min-h-9 items-center rounded-full px-3 text-sm font-semibold ${hit ? 'bg-brand text-white' : 'bg-white hover:bg-white/70'}`}
                    >
                      {s}
                    </Link>
                  );
                })}
              </div>
              <Link href={`/map?when=week&cat=${c.id}`} className="self-start text-sm font-extrabold text-brand hover:underline">
                Показати все на карті →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-5 px-6 pb-16 md:grid-cols-2">
        {[
          ['Формат', 'Як проходить заняття. Той самий напрям буває і лекцією, і колом, і курсом.', FORMATS],
          ['Для кого', 'Окремий фільтр: діти, пари, 60+, ветерани, інклюзивні заняття.', AUDIENCE],
        ].map(([title, text, items]) => (
          <div key={title as string} className="flex flex-col gap-3 rounded-section border-[1.5px] border-line p-6">
            <h2 className="font-head text-[22px] font-bold">{title as string}</h2>
            <p className="text-muted">{text as string}</p>
            <div className="flex flex-wrap gap-1.5">
              {(items as string[]).map((f) => (
                <span key={f} className="flex h-9 items-center rounded-full bg-chip px-3 text-sm font-semibold">{f}</span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
