'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { searchCatalog } from '@/lib/categories';

interface Props {
  activeCat: string;
  activeSub: string | null;
  counts: Map<string, number>;
  onPick: (cat: string, sub: string | null) => void;
  onClose: () => void;
}

export function CategoryPanel({ activeCat, activeSub, counts, onPick, onClose }: Props) {
  const [q, setQ] = useState('');
  const [current, setCurrent] = useState(activeCat !== 'all' ? activeCat : 'psy');
  const results = useMemo(() => searchCatalog(q), [q]);
  const cur = results.find((r) => r.category.id === current) ?? results[0];

  return (
    <div
      role="dialog"
      aria-label="Категорії"
      className="absolute inset-x-3 top-[calc(100%+6px)] z-50 flex h-[min(560px,70vh)] animate-pop flex-col gap-3 rounded-section border border-line bg-white p-4 shadow-float sm:inset-x-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border-[1.5px] border-line-strong bg-surface px-4">
          <Icon name="search" size={18} className="text-muted" />
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Пошук категорії"
            placeholder="Бокс, психологія, дихання…"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
        <Link href="/categories" className="hidden h-11 items-center px-3 text-sm font-bold text-brand sm:flex">
          Повний каталог →
        </Link>
        <button type="button" onClick={onClose} aria-label="Закрити" className="flex h-11 w-11 items-center justify-center rounded-full bg-chip">
          <Icon name="close" size={16} />
        </button>
      </div>
      {results.length === 0 ? (
        <p className="p-4 text-muted">Нічого не знайшли. Спробуй інше слово або відкрий повний каталог.</p>
      ) : (
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="hidden w-[290px] shrink-0 flex-col gap-0.5 overflow-y-auto pr-1 sm:flex">
            {results.map(({ category }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCurrent(category.id)}
                aria-pressed={cur?.category.id === category.id}
                className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-bold ${cur?.category.id === category.id ? 'bg-chip' : 'hover:bg-surface'}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-brand" style={{ background: category.tint }}>
                  <Icon d={category.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">{category.label}</span>
                <span className="text-xs font-semibold text-muted">{category.subs.length}</span>
              </button>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto rounded-card p-4" style={{ background: cur?.category.tint }}>
            {/* на телефоні — список категорій як горизонтальні чіпи */}
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 sm:hidden">
              {results.map(({ category }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCurrent(category.id)}
                  className={`h-9 shrink-0 rounded-full px-3 text-sm font-bold ${cur?.category.id === category.id ? 'bg-ink text-white' : 'bg-white/80'}`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            {cur && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-head text-xl font-bold">{cur.category.label}</span>
                  <button type="button" onClick={() => onPick(cur.category.id, null)} className="btn-dark h-10 text-sm">
                    Усе в категорії
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cur.subs.map((s) => {
                    const on = activeSub === s;
                    const n = counts.get(s) ?? 0;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onPick(cur.category.id, s)}
                        aria-pressed={on}
                        className={`flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${on ? 'bg-brand text-white' : 'bg-white hover:bg-white/70'}`}
                      >
                        {s}
                        {n > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-extrabold text-white">{n}</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

