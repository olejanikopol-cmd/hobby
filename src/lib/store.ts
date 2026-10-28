'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ACTIVITIES } from '@/data/activities';
import type { Activity } from './types';

/**
 * Демо-режим: дані користувача живуть у localStorage браузера.
 * Коли підключимо Supabase, цей модуль замінить шар API — сторінки змінювати не доведеться.
 */
export interface Booking {
  id: string;
  slug: string;
  start: string; // ISO
  createdAt: string;
  status: 'booked' | 'cancelled';
}

export interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
}

export interface AppState {
  user: { name: string; email: string } | null;
  interests: string[];
  district: string;
  bookings: Booking[];
  favorites: string[];
  created: Activity[];
  threads: Record<string, Message[]>;
  notify: { remind: boolean; changes: boolean; news: boolean };
}

const KEY = 'hobbyl:v1';

export const EMPTY_STATE: AppState = {
  user: null,
  interests: [],
  district: 'Увесь Київ',
  bookings: [],
  favorites: [],
  created: [],
  threads: {},
  notify: { remind: true, changes: true, news: false },
};

let state: AppState = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch {
    state = EMPTY_STATE;
  }
}

function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* приватний режим або переповнене сховище — працюємо в пам'яті */
  }
  listeners.forEach((l) => l());
}

export function update(fn: (s: AppState) => AppState) {
  load();
  state = fn(state);
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

const getServerSnapshot = () => EMPTY_STATE;

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** true після першого рендеру в браузері — щоб не блимати порожнім станом */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useActivities(): Activity[] {
  const { created } = useAppState();
  return useMemo(() => [...created, ...ACTIVITIES], [created]);
}

export function findActivity(all: Activity[], slug: string): Activity | undefined {
  return all.find((a) => a.slug === slug);
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const actions = {
  signIn(name: string, email: string) {
    update((s) => ({ ...s, user: { name, email } }));
  },
  signOut() {
    update((s) => ({ ...s, user: null }));
  },
  setInterests(interests: string[]) {
    update((s) => ({ ...s, interests }));
  },
  setDistrict(district: string) {
    update((s) => ({ ...s, district }));
  },
  setName(name: string) {
    update((s) => (s.user ? { ...s, user: { ...s.user, name } } : s));
  },
  toggleNotify(key: keyof AppState['notify']) {
    update((s) => ({ ...s, notify: { ...s.notify, [key]: !s.notify[key] } }));
  },
  toggleFavorite(slug: string) {
    update((s) => ({
      ...s,
      favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug],
    }));
  },
  book(slug: string, start: Date): Booking {
    const booking: Booking = { id: uid(), slug, start: start.toISOString(), createdAt: new Date().toISOString(), status: 'booked' };
    update((s) => {
      const exists = s.bookings.find((b) => b.slug === slug && b.start === booking.start && b.status === 'booked');
      if (exists) return s;
      return { ...s, bookings: [booking, ...s.bookings.filter((b) => !(b.slug === slug && b.start === booking.start))] };
    });
    return booking;
  },
  cancelBooking(id: string) {
    update((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) }));
  },
  restoreBooking(id: string) {
    update((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'booked' } : b)) }));
  },
  createActivity(a: Activity) {
    update((s) => ({ ...s, created: [a, ...s.created.filter((c) => c.slug !== a.slug)] }));
  },
  deleteActivity(slug: string) {
    update((s) => ({ ...s, created: s.created.filter((c) => c.slug !== slug), bookings: s.bookings.filter((b) => b.slug !== slug) }));
  },
  sendMessage(thread: string, text: string) {
    const msg: Message = { id: uid(), from: 'me', text, at: new Date().toISOString() };
    update((s) => ({ ...s, threads: { ...s.threads, [thread]: [...(s.threads[thread] ?? []), msg] } }));
  },
  resetAll() {
    update(() => EMPTY_STATE);
  },
};

export function isBooked(s: AppState, slug: string, start: Date): boolean {
  return s.bookings.some((b) => b.slug === slug && b.start === start.toISOString() && b.status === 'booked');
}
