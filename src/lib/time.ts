import type { Activity, Schedule, Session, When } from './types';

export const TZ = 'Europe/Kyiv';
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface KyivParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
}

export function kyivParts(date: Date): KyivParts {
  const p: Record<string, number> = {};
  for (const part of partsFmt.formatToParts(date)) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  return { y: p.year, m: p.month, d: p.day, hh: p.hour, mm: p.minute, ss: p.second };
}

/** Зсув Києва відносно UTC у хвилинах для конкретної миті (+120 взимку, +180 влітку). */
export function kyivOffsetMinutes(date: Date): number {
  const p = kyivParts(date);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / MINUTE);
}

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(date: Date): string {
  const p = kyivParts(date);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * DAY);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** День тижня дати: 1 — понеділок … 7 — неділя */
export function dayOfWeek(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return js === 0 ? 7 : js;
}

/** Київський «настінний» час → мить у UTC. Враховує перехід на літній/зимовий час. */
export function kyivTime(key: string, hhmm: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - kyivOffsetMinutes(new Date(guess)) * MINUTE;
  const off2 = kyivOffsetMinutes(new Date(t));
  t = guess - off2 * MINUTE;
  return new Date(t);
}

export const startOfDay = (key: string) => kyivTime(key, '00:00');

function sessionsOnDay(schedule: Schedule, key: string): Session[] {
  const on = schedule.type === 'weekly' ? schedule.days.includes(dayOfWeek(key)) : schedule.dates.includes(key);
  if (!on) return [];
  const start = kyivTime(key, schedule.start);
  let end = kyivTime(key, schedule.end);
  if (end <= start) end = new Date(end.getTime() + DAY);
  return [{ start, end }];
}

/** Усі заняття, що перетинаються з вікном [from, to). */
export function sessionsBetween(schedule: Schedule, from: Date, to: Date): Session[] {
  const out: Session[] = [];
  let key = addDays(dateKey(from), -1);
  const last = dateKey(to);
  for (let i = 0; i < 400; i++) {
    for (const s of sessionsOnDay(schedule, key)) {
      if (s.end > from && s.start < to) out.push(s);
    }
    if (key === last) break;
    key = addDays(key, 1);
  }
  return out;
}

export function upcomingSessions(activity: Activity, now: Date, count = 3, horizonDays = 60): Session[] {
  return sessionsBetween(activity.schedule, now, new Date(now.getTime() + horizonDays * DAY)).slice(0, count);
}

/** Вікно часу для фільтра. null — «Завжди» (без прив'язки до дати). */
export function windowFor(when: When, now: Date, date?: string): { from: Date; to: Date } | null {
  const today = dateKey(now);
  switch (when) {
    case 'now':
      return { from: now, to: new Date(now.getTime() + 2 * 60 * MINUTE) };
    case 'today':
      return { from: now, to: startOfDay(addDays(today, 1)) };
    case 'tomorrow':
      return { from: startOfDay(addDays(today, 1)), to: startOfDay(addDays(today, 2)) };
    case 'weekend': {
      const dow = dayOfWeek(today);
      if (dow >= 6) return { from: now, to: startOfDay(addDays(today, 8 - dow)) };
      const sat = addDays(today, 6 - dow);
      return { from: startOfDay(sat), to: startOfDay(addDays(sat, 2)) };
    }
    case 'week':
      return { from: now, to: new Date(now.getTime() + 7 * DAY) };
    case 'date': {
      const key = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
      const start = startOfDay(key);
      return { from: start > now ? start : now, to: startOfDay(addDays(key, 1)) };
    }
    case 'always':
      return null;
  }
}

/** Найближче заняття у вікні фільтра або null, якщо заняття під фільтр не підходить. */
export function sessionForWhen(activity: Activity, when: When, now: Date, date?: string): Session | null {
  const w = windowFor(when, now, date);
  if (!w) {
    if (activity.schedule.type !== 'weekly') return null;
    return upcomingSessions(activity, now, 1)[0] ?? null;
  }
  return sessionsBetween(activity.schedule, w.from, w.to)[0] ?? null;
}

const DOW_SHORT = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

export function timeLabel(d: Date): string {
  const p = kyivParts(d);
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

export function dayLabel(d: Date, now: Date): string {
  const key = dateKey(d);
  const today = dateKey(now);
  if (key === today) return 'Сьогодні';
  if (key === addDays(today, 1)) return 'Завтра';
  const p = kyivParts(d);
  return `${DOW_SHORT[dayOfWeek(key)]}, ${p.d} ${MONTHS[p.m - 1]}`;
}

export function sessionLabel(s: Session, now: Date): string {
  const live = s.start <= now && s.end > now;
  if (live) return `Йде зараз, до ${timeLabel(s.end)}`;
  return `${dayLabel(s.start, now)}, ${timeLabel(s.start)}`;
}

export function durationMinutes(schedule: Schedule): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const d = toMin(schedule.end) - toMin(schedule.start);
  return d > 0 ? d : d + 24 * 60;
}

export function scheduleLabel(schedule: Schedule): string {
  if (schedule.type === 'once') return `${schedule.start}–${schedule.end}`;
  const days = [...schedule.days].sort((a, b) => a - b);
  const daysText = days.length === 7 ? 'Щодня' : days.map((d) => DOW_SHORT[d]).join(', ');
  return `${daysText}, ${schedule.start}–${schedule.end}`;
}

export const WHEN_OPTIONS: { id: When; label: string }[] = [
  { id: 'now', label: 'Зараз' },
  { id: 'today', label: 'Сьогодні' },
  { id: 'tomorrow', label: 'Завтра' },
  { id: 'weekend', label: 'Вихідні' },
  { id: 'week', label: 'Тиждень' },
  { id: 'always', label: 'Завжди' },
];

export function isWhen(v: string | null | undefined): v is When {
  return !!v && ['now', 'today', 'tomorrow', 'weekend', 'week', 'always', 'date'].includes(v);
}
