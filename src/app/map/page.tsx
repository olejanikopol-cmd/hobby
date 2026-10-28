import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MapExplorer } from '@/components/MapExplorer';

export const metadata: Metadata = { title: 'Карта хобі Києва' };

export default function MapPage() {
  return (
    <main>
      <Suspense fallback={<div className="h-[calc(100dvh-64px)] animate-pulse bg-surface" />}>
        <MapExplorer />
      </Suspense>
    </main>
  );
}
