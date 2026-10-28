import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Messages } from '@/components/Messages';
import { RequireUser } from '@/components/RequireUser';

export const metadata: Metadata = { title: 'Повідомлення' };

export default function MessagesPage() {
  return (
    <RequireUser title="Увійдіть, щоб писати ведучим">
      <Suspense>
        <Messages />
      </Suspense>
    </RequireUser>
  );
}
