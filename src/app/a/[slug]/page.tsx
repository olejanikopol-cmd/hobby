import type { Metadata } from 'next';
import { ActivityView } from '@/components/ActivityView';
import { ACTIVITIES } from '@/data/activities';
import { htmlToText } from '@/lib/sanitize';

export function generateStaticParams() {
  return ACTIVITIES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ACTIVITIES.find((x) => x.slug === slug);
  if (!a) return { title: 'Заняття' };
  return { title: a.title, description: htmlToText(a.descriptionHtml).slice(0, 160) };
}

export default async function ActivityRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Створені у демо-режимі заняття живуть у браузері — їх знайде клієнтський компонент.
  const initial = ACTIVITIES.find((a) => a.slug === slug);
  return <ActivityView slug={slug} initial={initial} />;
}
