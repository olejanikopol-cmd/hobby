'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { RichTextEditor } from './RichTextEditor';
import { DISTRICTS } from './Onboarding';
import { AUDIENCE, CATEGORIES, FORMATS, getCategory } from '@/lib/categories';
import { priceLabel, slugify } from '@/lib/format';
import { sanitizeHtml, htmlToText } from '@/lib/sanitize';
import { actions, useActivities, useAppState } from '@/lib/store';
import type { Activity, PriceType, PriceUnit } from '@/lib/types';

const KyivMap = dynamic(() => import('./KyivMap'), { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#EEF2EE]" /> });

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const COVERS = ['#F4E4D4', '#DCEBE2', '#DDE8F0', '#EDE3F6', '#F5DFDF', '#FDF0D5'];
const STARTER = '<h3>Чому варто прийти</h3><p>Розкажи про заняття так, як говориш на ньому. Можна <b>жирним</b>, можна <s>закресленим</s>, можна <span style="font-family: Comfortaa, cursive; color: #2F6B4F">хвилястим</span>.</p>';

export function CreateActivity() {
  const router = useRouter();
  const { user } = useAppState();
  const all = useActivities();
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState('craft');
  const [sub, setSub] = useState(getCategory('craft')!.subs[0]);
  const [subQuery, setSubQuery] = useState('');
  const [format, setFormat] = useState(FORMATS[0]);
  const [audience, setAudience] = useState<string[]>(['Для дорослих']);
  const [html, setHtml] = useState(STARTER);
  const [mode, setMode] = useState<'weekly' | 'once'>('weekly');
  const [days, setDays] = useState<number[]>([3]);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('19:00');
  const [end, setEnd] = useState('21:00');
  const [district, setDistrict] = useState('Поділ');
  const [address, setAddress] = useState('');
  const [point, setPoint] = useState<{ lat: number; lng: number }>({ lat: 50.4501, lng: 30.5234 });
  const [priceType, setPriceType] = useState<PriceType>('paid');
  const [price, setPrice] = useState('500');
  const [unit, setUnit] = useState<PriceUnit>('visit');
  const [capacity, setCapacity] = useState('10');
  const [cover, setCover] = useState(COVERS[0]);
  const [errors, setErrors] = useState<string[]>([]);

  const cat = getCategory(catId)!;
  const subMatches = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    if (!q) return [];
    return CATEGORIES.flatMap((c) => c.subs.filter((s) => s.toLowerCase().includes(q)).map((s) => ({ c, s }))).slice(0, 8);
  }, [subQuery]);

  const validate = (): string[] => {
    const e: string[] = [];
    if (title.trim().length < 5) e.push('Назва — хоча б 5 символів');
    if (htmlToText(html).length < 20) e.push('Опис — хоча б 20 символів');
    if (mode === 'weekly' && days.length === 0) e.push('Оберіть дні тижня');
    if (mode === 'once' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) e.push('Оберіть дату');
    if (start === end) e.push('Початок і кінець не можуть збігатися');
    if (!address.trim()) e.push('Вкажіть адресу');
    if (priceType === 'paid' && !(Number(price) > 0)) e.push('Вкажіть ціну');
    if (!(Number(capacity) > 0)) e.push('Кількість місць — більше нуля');
    return e;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const base = slugify(title);
    let slug = base;
    for (let i = 2; all.some((a) => a.slug === slug); i++) slug = `${base}-${i}`;
    const activity: Activity = {
      slug,
      title: title.trim(),
      categoryId: catId,
      sub,
      format,
      audience,
      hostSlug: `me-${slugify(user?.name ?? 'host')}`,
      district,
      address: address.trim(),
      lat: point.lat,
      lng: point.lng,
      priceType,
      price: priceType === 'paid' ? Math.round(Number(price)) : undefined,
      priceUnit: priceType === 'paid' ? unit : undefined,
      capacity: Math.round(Number(capacity)),
      booked: 0,
      schedule: mode === 'weekly' ? { type: 'weekly', days: [...days].sort((x, y) => x - y), start, end } : { type: 'once', dates: [date], start, end },
      descriptionHtml: sanitizeHtml(html),
      cover,
      createdByUser: true,
    };
    actions.createActivity(activity);
    router.push(`/a/${slug}`);
  };

  const box = 'flex flex-col gap-4 rounded-[24px] bg-white p-5 sm:p-6';
  const h2 = 'font-head text-[22px] font-bold';
  const pill = (on: boolean) => `flex h-11 items-center rounded-control border-[1.5px] px-3.5 text-sm font-bold ${on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white hover:border-brand'}`;

  return (
    <main className="bg-surface">
      <form onSubmit={submit} noValidate className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="rounded-full bg-brand px-3 py-1 text-[13px] font-extrabold text-white">Режим ведучого</span>
            <h1 className="mt-3 font-head text-4xl font-extrabold">Нове заняття</h1>
            <p className="text-muted">Заповни блоки — і заняття одразу зʼявиться на карті.</p>
          </div>
          <Link href="/host" className="font-bold text-brand">← Мої заняття</Link>
        </div>

        {errors.length > 0 && (
          <div role="alert" className="rounded-card bg-danger-soft p-4 text-danger">
            <b>Перевірте:</b>
            <ul className="mt-1 list-disc pl-5">
              {errors.map((er) => (
                <li key={er}>{er}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-5">
            <fieldset className={box}>
              <legend className={`${h2} float-left`}>1. Що</legend>
              <label className="label clear-both">
                Назва
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Гончарство для новачків" className="field" maxLength={90} />
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="label flex-[1_1_240px]">
                  Категорія
                  <select
                    value={catId}
                    onChange={(e) => {
                      setCatId(e.target.value);
                      setSub(getCategory(e.target.value)!.subs[0]);
                    }}
                    className="field"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="label flex-[1_1_240px]">
                  Напрям
                  <select value={sub} onChange={(e) => setSub(e.target.value)} className="field">
                    {cat.subs.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="label">
                Або знайди напрям пошуком
                <input type="search" value={subQuery} onChange={(e) => setSubQuery(e.target.value)} placeholder="Наприклад: дихання, бокс, таро" className="field" />
              </label>
              {subMatches.length > 0 && (
                <div className="-mt-2 flex flex-wrap gap-1.5">
                  {subMatches.map(({ c, s }) => (
                    <button
                      key={c.id + s}
                      type="button"
                      onClick={() => {
                        setCatId(c.id);
                        setSub(s);
                        setSubQuery('');
                      }}
                      className="flex min-h-9 items-center rounded-full bg-chip px-3 text-sm font-semibold hover:bg-brand-soft"
                    >
                      {c.label} › {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">Формат</span>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATS.map((f) => (
                    <button key={f} type="button" onClick={() => setFormat(f)} aria-pressed={format === f} className={pill(format === f)}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">
                  Для кого <span className="font-normal text-muted">— можна кілька</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIENCE.map((x) => {
                    const on = audience.includes(x);
                    return (
                      <button key={x} type="button" onClick={() => setAudience((p) => (on ? p.filter((y) => y !== x) : [...p, x]))} aria-pressed={on} className={pill(on)}>
                        {x}
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>

            <section className={box}>
              <h2 className={h2}>2. Опис</h2>
              <RichTextEditor initialHtml={STARTER} onChange={setHtml} />
            </section>

            <fieldset className={box}>
              <legend className={`${h2} float-left`}>3. Коли</legend>
              <div className="clear-both flex gap-1 self-start rounded-full bg-chip p-1">
                {(['weekly', 'once'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`h-10 rounded-full px-4 text-sm font-bold ${mode === m ? 'bg-ink text-white' : ''}`}>
                    {m === 'weekly' ? 'Регулярно' : 'Разово'}
                  </button>
                ))}
              </div>
              {mode === 'weekly' ? (
                <div role="group" aria-label="Дні тижня" className="flex flex-wrap gap-1.5">
                  {DAYS.map((d, i) => {
                    const n = i + 1;
                    const on = days.includes(n);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays((p) => (on ? p.filter((x) => x !== n) : [...p, n]))}
                        aria-pressed={on}
                        className={`h-12 w-12 rounded-full border-[1.5px] text-sm font-extrabold ${on ? 'border-brand bg-brand text-white' : 'border-line-strong'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <label className="label max-w-xs">
                  Дата
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
                </label>
              )}
              <div className="flex flex-wrap gap-4">
                <label className="label flex-[1_1_140px]">
                  Початок
                  <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="field" />
                </label>
                <label className="label flex-[1_1_140px]">
                  Кінець
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="field" />
                </label>
              </div>
            </fieldset>

            <fieldset className={box}>
              <legend className={`${h2} float-left`}>4. Де</legend>
              <div className="clear-both flex flex-wrap gap-4">
                <label className="label flex-[1_1_200px]">
                  Район
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} className="field">
                    {DISTRICTS.filter((d) => d !== 'Увесь Київ').map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="label flex-[2_1_280px]">
                  Адреса (бачать лише записані)
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="вул. Межигірська, 3" className="field" />
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-bold">Точка на карті — клікни або перетягни мітку</span>
                <KyivMap compact pick={point} onPick={setPoint} className="relative h-[300px] rounded-[18px]" />
              </div>
            </fieldset>

            <fieldset className={box}>
              <legend className={`${h2} float-left`}>5. Ціна і місця</legend>
              <div className="clear-both flex flex-wrap gap-1.5">
                {(
                  [
                    ['paid', 'Платно'],
                    ['free', 'Безкоштовно'],
                    ['donate', 'Донат'],
                  ] as const
                ).map(([id, l]) => (
                  <button key={id} type="button" onClick={() => setPriceType(id)} aria-pressed={priceType === id} className={pill(priceType === id)}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {priceType === 'paid' && (
                  <>
                    <label className="label flex-[1_1_140px]">
                      Ціна, ₴
                      <input type="number" min={1} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="field" />
                    </label>
                    <label className="label flex-[1_1_180px]">
                      За що
                      <select value={unit} onChange={(e) => setUnit(e.target.value as PriceUnit)} className="field">
                        <option value="visit">за одне заняття</option>
                        <option value="month">за місяць</option>
                        <option value="course">за весь курс</option>
                      </select>
                    </label>
                  </>
                )}
                <label className="label flex-[1_1_140px]">
                  Місць у групі
                  <input type="number" min={1} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="field" />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">Колір обкладинки</span>
                <div className="flex flex-wrap gap-2">
                  {COVERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCover(c)}
                      aria-pressed={cover === c}
                      aria-label={`Колір ${c}`}
                      className={`h-11 w-11 rounded-[14px] border-[3px] shadow-[inset_0_0_0_3px_#fff] ${cover === c ? 'border-brand' : 'border-line'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </fieldset>
          </div>

          <aside className="flex w-full min-w-0 flex-[1_1_320px] flex-col gap-3 lg:sticky lg:top-24">
            <span className="font-wave text-xl font-bold text-brand">Так тебе побачать на карті</span>
            <div className="flex flex-col gap-2.5 rounded-[24px] bg-white p-4 shadow-card">
              <div aria-hidden="true" className="relative h-[150px] overflow-hidden rounded-2xl transition-colors" style={{ background: cover }}>
                <Icon d={cat.icon} size={150} stroke={1} className="absolute -right-4 -bottom-6 text-ink/25" />
                <span className="absolute top-3 right-3 rounded-full border-2 border-white bg-brand px-3 py-1.5 text-[13px] font-extrabold text-white">
                  {priceLabel({ priceType, price: Number(price) || 0, priceUnit: unit })}
                </span>
              </div>
              <span className="text-xs font-extrabold tracking-[0.05em] text-brand uppercase">
                {format}, {sub}
              </span>
              <span className="font-head text-xl leading-snug font-bold">{title || 'Назва заняття'}</span>
              <span className="text-sm text-muted">
                {mode === 'weekly' ? (days.length ? [...days].sort((x, y) => x - y).map((d) => DAYS[d - 1]).join(', ') : 'Дні не обрано') : date || 'Дата не обрана'}, {start}, {district}
              </span>
              <span className="text-sm text-muted">{capacity} місць, веде {user?.name}</span>
            </div>
            <button type="submit" className="btn-primary h-14 text-base font-extrabold">Опублікувати на карті</button>
            <p className="text-xs text-muted">Демо-режим: заняття зберігається у вашому браузері і зʼявляється на карті лише у вас.</p>
          </aside>
        </div>
      </form>
    </main>
  );
}
