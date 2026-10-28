import type { Metadata } from 'next';
import { HostDashboard } from '@/components/HostDashboard';
import { RequireUser } from '@/components/RequireUser';

export const metadata: Metadata = { title: 'Кабінет ведучого' };

export default function HostPage() {
  return (
    <RequireUser title="Увійдіть, щоб відкрити кабінет ведучого">
      <HostDashboard />
    </RequireUser>
  );
}
