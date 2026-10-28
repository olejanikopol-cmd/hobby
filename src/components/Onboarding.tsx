'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { CATEGORIES, plural } from '@/lib/categories';
import { safeNext } from '@/lib/nav';
import { actions, useAppState, useHydrated } from '@/lib/store';

export const DISTRICTS = ['Увесь Київ', 'Поділ', 'Печерськ', 'Шевченківський', 'Оболонь', 'Позняки', 'Осокорки', 'Лівобережна', 'Лук’янівка', 'Шулявка', 'Видубичі', 'Троєщина', 'Святошин', 'Голосіїв'];

export function Onboarding() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-[640px] w-full max-w-[560px] animate-pulse rounded-section bg-white" />;
  return <OnboardingForm />;
}

function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const state = useAppState();
  const [picked, setPicked] = useState<string[]>(state.interests);
  const [tab, setTab] = useState(CATEGORIES[0].id);
  const [q, setQ] = useState('');
  const [district, setDistrict] = useState(state.district);

  const cur = CATEGORIES.find((c) => c.id === tab) ?? CATEGORIES[0];
  const pool = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return cur.subs;
    return CATEGORIES.flatMap((c) => (c.label.toLowerCase().includes(n) ? c.subs : c.subs.filter((s) => s.toLowerCase().includes(n))));
  }, [q, cur]);

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const save = () => {
    actions.setInterests(picked);
    actions.setDistrict(district);
    router.push(next);
  };

  return (
    <div className="flex w-full max-w-[560px] animate-rise flex-col gap-4 rounded-section bg-white p-5 shadow-card sm:p-7">
      <div className="h-1.5 rounded-full bg-brand-soft">
        <div className="h-full w-full rounded-full bg-brand" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-wave text-lg font-bold text-brand">Привіт!</span>
        <h1 className="font-head text-3xl font-extrabold">Що тобі цікаво?</h1>
        <p className="text-[15px] text-muted">Обери напрями — покажемо їх першими. Змінити можна будь-коли в кабінеті.</p>
      </div>
      <label className="flex h-12 items-center gap-2.5 rounded-full border-[1.5px] border-line-strong bg-surface px-4">
        <Icon name="search" size={18} className="text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Пошук напряму" placeholder="Бокс, кераміка, медитація…" className="min-w-0 flex-1 bg-transparent outline-none" />
      </label>
      {!q && (
        <div role="group" aria-label="Категорії" className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
          {CATEGORIES.map((c) => {
            const n = c.subs.filter((s) => picked.includes(s)).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                aria-pressed={c.id === tab}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold ${c.id === tab ? 'bg-ink text-white' : 'bg-chip'}`}
              >
                {c.label}
                {n > 0 && <span className="rounded-full bg-amber px-1.5 text-[11px] font-extrabold text-ink">{n}</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex max-h-[320px] min-h-[200px] flex-col gap-2.5 overflow-y-auto rounded-card p-4" style={{ background: q ? '#F5F8F6' : cur.tint }}>
        <span className="text-[13px] font-extrabold text-ink-2">{q ? `Знайдено: ${pool.length}` : cur.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {pool.map((s) => {
            const on = picked.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={on}
                className={`flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-left text-sm font-semibold ${on ? 'border-brand bg-brand text-white' : 'border-ink/10 bg-white'}`}
              >
                {on && <Icon name="check" size={14} stroke={3} />}
                {s}
              </button>
            );
          })}
          {q && pool.length === 0 && <span className="text-sm text-muted">Нічого не знайшли — спробуй інше слово.</span>}
        </div>
      </div>
      <label className="label">
        Де шукати
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="field">
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2.5">
        <button type="button" onClick={() => router.push(next)} className="btn h-[52px] px-5 text-ink-2">Пропустити</button>
        <button type="button" onClick={save} className="btn-primary h-[52px] flex-1 text-base font-extrabold">
          Далі, обрано {picked.length} {plural(picked.length, 'напрям', 'напрями', 'напрямів')}
        </button>
      </div>
    </div>
  );
}
