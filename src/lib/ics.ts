import type { Activity, Session } from './types';

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Файл .ics для «Додати в календар» (Google, Apple, Outlook розуміють). */
export function buildIcs(activity: Activity, session: Session, url: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//hobbyl//UA',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${activity.slug}-${session.start.getTime()}@hobbyl`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(session.start)}`,
    `DTEND:${fmt(session.end)}`,
    `SUMMARY:${esc(activity.title)}`,
    `LOCATION:${esc(`${activity.district}, ${activity.address}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(activity.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(activity: Activity, session: Session) {
  const blob = new Blob([buildIcs(activity, session, window.location.href)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${activity.slug}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
