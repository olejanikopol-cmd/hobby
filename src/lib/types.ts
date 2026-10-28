export type PriceType = 'paid' | 'free' | 'donate';
export type PriceUnit = 'visit' | 'month' | 'course';

/** Розклад зберігаємо в місцевому часі Києва: так переходи на літній/зимовий час не зсувають заняття. */
export interface WeeklySchedule {
  type: 'weekly';
  /** 1 — понеділок … 7 — неділя */
  days: number[];
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
}

export interface OnceSchedule {
  type: 'once';
  dates: string[]; // 'YYYY-MM-DD'
  start: string;
  end: string;
}

export type Schedule = WeeklySchedule | OnceSchedule;

export interface Activity {
  slug: string;
  title: string;
  categoryId: string;
  sub: string;
  format: string;
  audience: string[];
  hostSlug: string;
  district: string;
  /** Точну адресу показуємо лише записаним */
  address: string;
  lat: number;
  lng: number;
  priceType: PriceType;
  price?: number;
  priceUnit?: PriceUnit;
  capacity: number;
  booked: number;
  schedule: Schedule;
  /** HTML з редактора ведучого; перед показом проходить sanitizeHtml */
  descriptionHtml: string;
  program?: { title: string; minutes: number }[];
  includes?: string[];
  cover: string;
  createdByUser?: boolean;
}

export interface Host {
  slug: string;
  name: string;
  role: string;
  bio: string;
  district: string;
  instagram?: string;
  telegram?: string;
}

export interface Category {
  id: string;
  label: string;
  tint: string;
  icon: string;
  subs: string[];
}

export interface Session {
  start: Date;
  end: Date;
}

export type When = 'now' | 'today' | 'tomorrow' | 'weekend' | 'week' | 'always' | 'date';
