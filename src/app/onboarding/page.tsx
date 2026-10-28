import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Onboarding } from '@/components/Onboarding';

export const metadata: Metadata = { title: 'Що тобі цікаво?' };

export default function OnboardingPage() {
  return (
    <main className="flex min-h-[calc(100dvh-64px)] justify-center bg-surface px-4 py-8">
      <Suspense>
        <Onboarding />
      </Suspense>
    </main>
  );
}
