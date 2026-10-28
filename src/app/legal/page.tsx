import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = { title: 'Правила і конфіденційність' };

const DOCS = {
  terms: {
    label: 'Правила',
    title: 'Правила користування',
    sections: [
      ['1. Що таке hobbyl', 'hobbyl — карта хобі Києва. Ми показуємо заняття, які публікують ведучі, і допомагаємо на них записатися. Ми не організовуємо заняття самі.'],
      ['2. Запис і оплата', 'Запис безкоштовний. Оплата — на місці, ведучому: готівкою або карткою. Скасувати запис можна за 24 години до початку.'],
      ['3. Для ведучих', 'Ведучий відповідає за опис, ціну, розклад і безпеку заняття. Якщо заняття переноситься чи скасовується, учасники отримують сповіщення.'],
      ['4. Скарги і модерація', 'На кожній сторінці заняття можна поскаржитися. Ми можемо приховати заняття, яке порушує ці правила.'],
    ],
  },
  privacy: {
    label: 'Конфіденційність',
    title: 'Політика конфіденційності',
    sections: [
      ['1. Які дані збираємо', 'Імʼя, email або Telegram для входу, район та інтереси з онбордингу, ваші записи й обране.'],
      ['2. Навіщо', 'Щоб ви могли записуватися, отримувати нагадування і бачити заняття поруч. Ми не продаємо дані.'],
      ['3. Хто бачить', 'Ведучий бачить імʼя тих, хто записався на його заняття. Точну адресу студії бачать лише записані учасники.'],
      ['4. Де зберігаються', 'У демо-версії — лише у вашому браузері. На робочому сайті — на серверах постачальника бази даних.'],
      ['5. Ваші права', 'Ви можете змінити або видалити свої дані в «Налаштуваннях» кабінету. Ми діємо згідно із Законом України «Про захист персональних даних».'],
    ],
  },
} as const;

export default async function LegalPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab = raw === 'privacy' ? 'privacy' : 'terms';
  const doc = DOCS[tab];
  return (
    <>
      <main className="mx-auto flex max-w-[820px] flex-col gap-6 px-6 pt-10 pb-16">
        <div role="tablist" aria-label="Документи" className="flex gap-1 self-start rounded-full bg-chip p-1">
          {(Object.keys(DOCS) as (keyof typeof DOCS)[]).map((id) => (
            <Link
              key={id}
              role="tab"
              aria-selected={tab === id}
              href={id === 'terms' ? '/legal' : '/legal?tab=privacy'}
              className={`flex h-11 items-center rounded-full px-5 font-bold ${tab === id ? 'bg-ink text-white' : ''}`}
            >
              {DOCS[id].label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-head text-4xl leading-tight font-extrabold">{doc.title}</h1>
          <span className="text-sm text-muted">Редакція від 28 жовтня 2026. Чернетка — перед запуском перевірити з юристом.</span>
        </div>
        {doc.sections.map(([h, p]) => (
          <section key={h} className="flex flex-col gap-2">
            <h2 className="font-head text-xl font-bold">{h}</h2>
            <p className="leading-relaxed text-ink-2">{p}</p>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
