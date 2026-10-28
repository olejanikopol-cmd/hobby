import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="font-logo text-7xl font-extrabold tracking-[-0.04em] text-brand">404</span>
      <h1 className="font-head text-3xl font-extrabold">Такої сторінки немає</h1>
      <p className="text-muted">Можливо, посилання застаріло. Почніть з карти — там усе найцікавіше.</p>
      <div className="flex gap-2">
        <Link href="/map" className="btn-primary">До карти</Link>
        <Link href="/" className="btn-ghost">На головну</Link>
      </div>
    </main>
  );
}
