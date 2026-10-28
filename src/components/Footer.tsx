import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-8">
        <span className="font-logo text-2xl font-extrabold tracking-[-0.04em] text-brand">hobbyl</span>
        <span className="text-sm text-muted">Хобі поруч із домом, Київ</span>
        <nav aria-label="Посилання" className="ml-auto flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-2">
          <Link href="/categories" className="hover:text-brand">Категорії</Link>
          <Link href="/legal" className="hover:text-brand">Правила</Link>
          <Link href="/legal?tab=privacy" className="hover:text-brand">Конфіденційність</Link>
        </nav>
        <p className="w-full text-xs text-muted">
          Карта: © OpenFreeMap © OpenMapTiles © OpenStreetMap. Супутник: Sentinel-2 cloudless — s2maps.eu (EOX).
        </p>
      </div>
    </footer>
  );
}
