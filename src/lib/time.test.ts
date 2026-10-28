import { describe, expect, it } from 'vitest';
import { addDays, dateKey, dayOfWeek, kyivTime, sessionForWhen, sessionsBetween, windowFor } from './time';
import type { Activity } from './types';

const activity = (schedule: Activity['schedule']): Activity => ({
  slug: 't', title: 't', categoryId: 'craft', sub: 's', format: 'Клуб', audience: [], hostSlug: 'h',
  district: 'Поділ', address: '', lat: 0, lng: 0, priceType: 'free', capacity: 10, booked: 0,
  schedule, descriptionHtml: '', cover: '#fff',
});

describe('часовий пояс Києва', () => {
  it('влітку UTC+3', () => {
    expect(kyivTime('2026-07-01', '19:00').toISOString()).toBe('2026-07-01T16:00:00.000Z');
  });
  it('взимку UTC+2', () => {
    expect(kyivTime('2026-12-01', '19:00').toISOString()).toBe('2026-12-01T17:00:00.000Z');
  });
  it('у день переходу на зимовий час (25.10.2026) вечірнє заняття вже UTC+2', () => {
    expect(kyivTime('2026-10-25', '19:00').toISOString()).toBe('2026-10-25T17:00:00.000Z');
  });
  it('дата за Києвом, а не за UTC', () => {
    // 23:30 UTC 31 грудня — у Києві вже 1 січня
    expect(dateKey(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
  it('дні тижня і додавання днів', () => {
    expect(dayOfWeek('2026-10-28')).toBe(3);
    expect(dayOfWeek('2026-11-01')).toBe(7);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('фільтр часу', () => {
  const wed1740 = new Date('2026-10-28T15:40:00Z'); // середа, 17:40 у Києві
  const weekly = activity({ type: 'weekly', days: [1, 3, 5], start: '19:00', end: '21:00' });

  it('«Зараз» — старт у найближчі 2 години', () => {
    expect(sessionForWhen(weekly, 'now', wed1740)).not.toBeNull();
    const late = activity({ type: 'weekly', days: [3], start: '20:30', end: '22:00' });
    expect(sessionForWhen(late, 'now', wed1740)).toBeNull();
  });

  it('«Зараз» включає заняття, що вже йде', () => {
    const running = activity({ type: 'weekly', days: [3], start: '17:00', end: '18:00' });
    expect(sessionForWhen(running, 'now', wed1740)).not.toBeNull();
  });

  it('«Сьогодні» не показує те, що вже закінчилось', () => {
    const morning = activity({ type: 'weekly', days: [3], start: '08:00', end: '09:00' });
    expect(sessionForWhen(morning, 'today', wed1740)).toBeNull();
    expect(sessionForWhen(weekly, 'today', wed1740)).not.toBeNull();
  });

  it('«Завтра» — четвер', () => {
    const thu = activity({ type: 'weekly', days: [4], start: '19:00', end: '21:00' });
    expect(sessionForWhen(thu, 'tomorrow', wed1740)).not.toBeNull();
    expect(sessionForWhen(weekly, 'tomorrow', wed1740)).toBeNull();
  });

  it('«Вихідні» з середи — найближчі субота і неділя', () => {
    const w = windowFor('weekend', wed1740)!;
    expect(dateKey(w.from)).toBe('2026-10-31');
    expect(dateKey(new Date(w.to.getTime() - 1))).toBe('2026-11-01');
  });

  it('«Вихідні» в неділю — лише сьогодні', () => {
    const sunday = new Date('2026-11-01T10:00:00Z');
    const w = windowFor('weekend', sunday)!;
    expect(w.from).toEqual(sunday);
    expect(dateKey(new Date(w.to.getTime() - 1))).toBe('2026-11-01');
  });

  it('«Завжди» — лише регулярні заняття', () => {
    expect(sessionForWhen(weekly, 'always', wed1740)).not.toBeNull();
    const once = activity({ type: 'once', dates: ['2026-10-30'], start: '12:00', end: '14:00' });
    expect(sessionForWhen(once, 'always', wed1740)).toBeNull();
  });

  it('конкретна дата', () => {
    expect(sessionForWhen(weekly, 'date', wed1740, '2026-10-30')).not.toBeNull();
    expect(sessionForWhen(weekly, 'date', wed1740, '2026-10-29')).toBeNull();
  });

  it('заняття через північ не губиться', () => {
    const night = activity({ type: 'weekly', days: [3], start: '22:00', end: '01:00' });
    const s = sessionsBetween(night.schedule, wed1740, new Date(wed1740.getTime() + 86_400_000));
    expect(s).toHaveLength(1);
    expect(s[0].end.getTime() - s[0].start.getTime()).toBe(3 * 3_600_000);
  });
});
