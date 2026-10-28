import data from '@/data/categories.json';
import type { Category } from './types';

export const CATEGORIES: Category[] = data.categories;
export const FORMATS: string[] = data.formats;
export const AUDIENCE: string[] = data.audience;

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return byId.get(id);
}

export const SUBCATEGORY_COUNT = CATEGORIES.reduce((n, c) => n + c.subs.length, 0);

/** Пошук по каталогу: категорія підходить цілком, якщо збіглась її назва; інакше — лише напрями, що збіглися. */
export function searchCatalog(query: string): { category: Category; subs: string[] }[] {
  const q = query.trim().toLowerCase();
  return CATEGORIES.map((category) => {
    if (!q || category.label.toLowerCase().includes(q)) return { category, subs: category.subs };
    return { category, subs: category.subs.filter((s) => s.toLowerCase().includes(q)) };
  }).filter((r) => r.subs.length > 0);
}

export function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && !(b >= 12 && b <= 14)) return few;
  return many;
}
