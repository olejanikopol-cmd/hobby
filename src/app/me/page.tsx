import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cabinet } from '@/components/Cabinet';
import { RequireUser } from '@/components/RequireUser';

export const metadata: Metadata = { title: 'Мій кабінет' };

export default function MePage() {
  return (
    <RequireUser>
      <Suspense>
        <Cabinet />
      </Suspense>
    </RequireUser>
  );
}
