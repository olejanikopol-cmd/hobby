import type { Metadata } from 'next';
import { CreateActivity } from '@/components/CreateActivity';
import { RequireUser } from '@/components/RequireUser';

export const metadata: Metadata = { title: 'Нове заняття' };

export default function NewActivityPage() {
  return (
    <RequireUser title="Увійдіть, щоб створити заняття">
      <CreateActivity />
    </RequireUser>
  );
}
