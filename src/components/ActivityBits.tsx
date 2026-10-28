'use client';

import Link from 'next/link';
import { Icon } from './Icon';
import { getCategory } from '@/lib/categories';
import { priceLabel } from '@/lib/format';
import { actions, useAppState, useHydrated } from '@/lib/store';
import type { Activity } from '@/lib/types';

const PRICE_STYLE = {
  paid: 'bg-surface text-ink',
  free: 'bg-brand-soft text-brand-dark',
  donate: 'bg-amber-soft text-amber-ink',
} as const;

export function PriceTag({ activity, className = '' }: { activity: Activity; className?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-sm font-extrabold whitespace-nowrap ${PRICE_STYLE[activity.priceType]} ${className}`}>
      {priceLabel(activity)}
    </span>
  );
}

/** Обкладинка без фото: колір категорії, велика іконка-графіка і підпис напряму. */
export function Cover({ activity, size = 'md', className = '' }: { activity: Activity; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const cat = getCategory(activity.categoryId);
  const icon = size === 'sm' ? 'right-[-10px] bottom-[-10px] h-[78px] w-[78px]' : size === 'md' ? 'right-[-14px] bottom-[-22px] h-[150px] w-[150px]' : 'right-[2%] bottom-[-18%] h-[130%] w-auto aspect-square';
  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${className}`} style={{ background: activity.cover || cat?.tint }}>
      {cat && <Icon d={cat.icon} size={24} stroke={size === 'lg' ? 0.7 : 1.1} className={`absolute text-ink/20 ${icon}`} />}
      {size === 'lg' && (
        <span className="absolute bottom-6 left-6 max-w-[60%] font-wave text-2xl leading-tight font-bold text-ink/70 sm:bottom-8 sm:left-8 sm:text-4xl">{activity.sub}</span>
      )}
      {size === 'sm' && <span className="absolute top-2 left-2.5 right-2 font-wave text-[11px] leading-tight font-bold text-ink/60">{activity.sub}</span>}
    </div>
  );
}

export function FavoriteButton({ slug, className = '' }: { slug: string; className?: string }) {
  const { favorites } = useAppState();
  const hydrated = useHydrated();
  const on = hydrated && favorites.includes(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        actions.toggleFavorite(slug);
      }}
      aria-pressed={on}
      aria-label={on ? 'Прибрати з обраного' : 'Додати в обране'}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] ${on ? 'border-[#F2A7A7] bg-danger-soft text-[#E2574C]' : 'border-line-strong bg-white text-ink hover:border-brand'} ${className}`}
    >
      <Icon name="heart" size={18} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function CategoryLabel({ activity }: { activity: Activity }) {
  return <span className="text-xs font-extrabold tracking-[0.05em] text-brand uppercase">{activity.format}</span>;
}

/** Картка заняття для сіток (кабінет, профіль ведучого, лендинг). */
export function ActivityTile({ activity, meta }: { activity: Activity; meta: string }) {
  return (
    <Link href={`/a/${activity.slug}`} className="group card flex flex-col overflow-hidden shadow-card hover:-translate-y-0.5">
      <div className="relative">
        <Cover activity={activity} className="h-36" />
        <FavoriteButton slug={activity.slug} className="absolute top-3 right-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <CategoryLabel activity={activity} />
        <span className="font-head text-lg leading-snug font-bold group-hover:text-brand">{activity.title}</span>
        <span className="text-sm text-muted">{meta}</span>
        <span className="mt-auto pt-2">
          <PriceTag activity={activity} />
        </span>
      </div>
    </Link>
  );
}
