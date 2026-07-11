import { getUsersList } from '@/services/admin-service';
import { AdminUsersTable } from '@/components/admin/admin-users-table';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'إدارة المستخدمين' };

export default async function AdminUsersPage() {
  const { users } = await getUsersList(0, 50);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">المستخدمين</h1>
      <AdminUsersTable initialUsers={users} />
    </div>
  );
}
