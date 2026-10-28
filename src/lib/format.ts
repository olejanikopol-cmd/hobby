import type { Activity } from './types';

const UNIT = { visit: '', month: '/міс', course: ' за курс' } as const;

export function priceLabel(a: Pick<Activity, 'priceType' | 'price' | 'priceUnit'>): string {
  if (a.priceType === 'free') return 'Безкоштовно';
  if (a.priceType === 'donate') return 'Донат';
  return `${a.price ?? 0} ₴${UNIT[a.priceUnit ?? 'visit']}`;
}

/** Коротка ціна для мітки на карті */
export function pinLabel(a: Pick<Activity, 'priceType' | 'price'>): string {
  if (a.priceType === 'free') return 'Безкоштовно';
  if (a.priceType === 'donate') return 'Донат';
  return `${a.price ?? 0} ₴`;
}

export function spotsLeft(a: Pick<Activity, 'capacity' | 'booked'>): number {
  return Math.max(0, a.capacity - a.booked);
}

export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
    ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', "'": '', '’': '', 'ʼ': '',
  };
  const out = text
    .toLowerCase()
    .split('')
    .map((ch) => (ch in map ? map[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return out || 'zaniattia';
}
