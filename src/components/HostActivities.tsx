'use client';

import { ActivityTile } from './ActivityBits';
import { useActivities } from '@/lib/store';
import { scheduleLabel } from '@/lib/time';

export function HostActivities({ hostSlug }: { hostSlug: string }) {
  const list = useActivities().filter((a) => a.hostSlug === hostSlug);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-head text-3xl font-extrabold">Заняття</h2>
      {list.length === 0 ? (
        <p className="text-muted">Поки немає опублікованих занять.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <ActivityTile key={a.slug} activity={a} meta={`${scheduleLabel(a.schedule)}, ${a.district}`} />
          ))}
        </div>
      )}
    </section>
  );
}
