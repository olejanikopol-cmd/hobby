import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { TodayRail } from '@/components/TodayRail';
import { CATEGORIES, SUBCATEGORY_COUNT, getCategory } from '@/lib/categories';
import { WHEN_OPTIONS } from '@/lib/time';

const FEATURED: [string, string][] = [
  ['craft', 'Гончарство, столярка, вишивка, свічки'],
  ['martial', 'Бокс, муай-тай, джиу-джитсу, фехтування'],
  ['dance', 'Сальса, бачата, хіп-хоп, танго'],
  ['psy', 'Лекції, терапія в колі, групи підтримки'],
  ['breath', 'Медитація, холотропне дихання, звукові практики'],
  ['music', 'Вокал, гітара, діджеїнг, бітмейкінг'],
  ['lang', 'Розмовні клуби, англійська, польська'],
  ['food', 'Хліб на заквасці, випічка, азійська кухня'],
];

const HERO_PINS = [
  { label: '650 ₴', x: 41.1, y: 40.9, cls: 'bg-brand text-white' },
  { label: 'Безкоштовно', x: 40.5, y: 52.3, cls: 'bg-brand-soft text-brand-dark' },
  { label: '300 ₴', x: 70.7, y: 50, cls: 'bg-white text-ink' },
  { label: '3200 ₴', x: 51.8, y: 63.3, cls: 'bg-white text-ink' },
  { label: 'Донат', x: 41.8, y: 15.6, cls: 'bg-amber-soft text-amber-ink' },
  { label: '1200 ₴', x: 76, y: 76, cls: 'bg-white text-ink' },
];

export default function Home() {
  return (
    <>
      <main>
        <section className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 px-6 pt-10 pb-16">
          <div className="flex min-w-0 flex-[1_1_460px] animate-rise flex-col gap-6">
            <span className="self-start rounded-full bg-amber-soft px-4 py-1.5 font-wave text-lg font-bold text-amber-ink">Київ, хобі поруч із домом</span>
            <h1 className="font-head text-5xl leading-[1.04] font-extrabold tracking-[-0.015em] sm:text-[64px]">Знайди хобі на карті свого міста</h1>
            <p className="max-w-[520px] text-lg leading-relaxed text-ink-2 sm:text-[19px]">
              Гончарство, бокс, шахи, йога, танці. Дивись, що відбувається сьогодні поруч, скільки це коштує — і записуйся в один клік.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/map" className="btn-primary h-14 px-7 text-[17px]">
                <Icon name="map" />
                Відкрити карту
              </Link>
              <Link href="/host/new" className="btn-ghost h-14 px-6 text-[17px]">
                Я веду заняття
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {WHEN_OPTIONS.filter((w) => w.id !== 'week').map((w) => (
                <Link key={w.id} href={`/map?when=${w.id}`} className="flex h-10 items-center gap-2 rounded-full bg-chip px-3.5 text-sm font-bold hover:bg-brand-soft">
                  {w.id === 'now' && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber" />}
                  {w.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/map"
            aria-label="Відкрити карту занять"
            className="relative h-[460px] min-w-0 flex-[1_1_520px] animate-rise overflow-hidden rounded-[32px] bg-[#EEF4EF] shadow-[0_24px_60px_rgba(22,36,29,0.16)] [animation-delay:120ms] sm:h-[540px]"
          >
            <div className="absolute top-1/2 left-1/2 aspect-[5/4] w-[max(100%,675px)] -translate-x-1/2 -translate-y-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kyiv-map.jpg" alt="" className="absolute inset-0 h-full w-full" fetchPriority="high" />
              {HERO_PINS.map((p, i) => (
                <span
                  key={p.label + i}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 animate-pop rounded-full border-2 border-white px-3 py-1.5 text-[13px] font-extrabold whitespace-nowrap shadow-[0_4px_12px_rgba(22,36,29,0.18)] ${p.cls}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${300 + i * 90}ms` }}
                >
                  {p.label}
                </span>
              ))}
            </div>
            <span className="absolute right-2.5 bottom-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] text-ink-2">© OpenFreeMap © OpenMapTiles © OpenStreetMap</span>
          </Link>
        </section>

        <section className="bg-surface">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-16">
            <h2 className="font-head text-4xl font-extrabold">Як це працює</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ['1', 'Обери час', 'Зараз, сьогодні, на вихідних — або «Завжди», щоб побачити постійні секції та клуби.'],
                ['2', 'Знайди на карті', 'Ціна видна одразу на мітці. 29 категорій — від боксу до холотропного дихання.'],
                ['3', 'Запишись', 'Місце бронюється в один клік, оплата на місці. Подію можна додати в календар.'],
              ].map(([n, t, d]) => (
                <div key={n} className="flex flex-col gap-2.5 rounded-[24px] bg-white p-7">
                  <span className="font-head text-4xl font-extrabold text-brand">{n}</span>
                  <span className="font-head text-2xl font-bold">{t}</span>
                  <span className="leading-relaxed text-ink-2">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TodayRail />

        <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-head text-4xl font-extrabold">Що можна знайти</h2>
            <Link href="/categories" className="font-bold text-brand hover:underline">
              Усі {CATEGORIES.length} категорій і {SUBCATEGORY_COUNT} напрямів →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map(([id, examples]) => {
              const c = getCategory(id)!;
              return (
                <Link
                  key={id}
                  href={`/map?when=week&cat=${id}`}
                  className="group flex min-h-[180px] flex-col justify-between gap-6 rounded-[26px] p-6 hover:-translate-y-1"
                  style={{ background: c.tint }}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white text-brand transition-transform duration-500 group-hover:rotate-[-8deg]">
                      <Icon d={c.icon} size={22} stroke={1.9} />
                    </span>
                    <span className="font-head text-[22px] leading-tight font-bold">{c.label}</span>
                  </span>
                  <span className="text-[15px] leading-normal text-ink-2">{examples}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto flex max-w-[1192px] flex-wrap items-center gap-10 rounded-[36px] bg-brand p-8 text-white sm:p-14">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
              <span className="font-wave text-[22px] font-bold text-amber">Ведеш заняття?</span>
              <h2 className="font-head text-4xl leading-tight font-extrabold sm:text-[44px]">Покажи своє хобі на карті Києва</h2>
              <ul className="flex flex-col gap-2.5 text-[17px] text-[#E4EFE8]">
                {['Безкоштовна сторінка ведучого', 'Опис як хочеш: будь-яке слово жирним, закресленим, кольоровим', 'Усі записи учасників в одному місці'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Icon name="check" className="shrink-0 text-amber" stroke={2.6} />
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/host/new" className="btn mt-2 h-14 self-start bg-white px-7 text-[17px] text-brand-dark hover:bg-brand-soft">
                Стати ведучим
              </Link>
            </div>
            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3 rounded-[26px] bg-white p-6 text-ink">
              <span className="font-head text-2xl font-extrabold">Глина слухається</span>
              <p className="text-[17px] leading-relaxed">
                Перша чашка — <b>вже сьогодні</b>. Боятися <s>забруднитися</s> не треба, а{' '}
                <span className="font-wave font-bold text-brand">настрій</span> беріть із собою.{' '}
                <span className="rounded bg-amber-soft px-1">Досвід не потрібен.</span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
