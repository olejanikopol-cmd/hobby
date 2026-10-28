import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = { title: 'Вхід' };

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100dvh-64px)] items-start justify-center bg-surface px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
