/** Безпечний шлях повернення після входу: лише внутрішні адреси. */
export function safeNext(next: string | null | undefined, fallback = '/map'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return fallback;
  return next;
}
