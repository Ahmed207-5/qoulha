'use client';

import * as React from 'react';
import Image from 'next/image';
import { suspendUserAction } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-elements';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface AdminUserRow {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  message_count: number;
  is_suspended: boolean;
  is_admin: boolean;
  created_at: string;
}

export function AdminUsersTable({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = React.useState(initialUsers);
  const [search, setSearch] = React.useState('');

  async function handleToggleSuspend(user: AdminUserRow) {
    const next = !user.is_suspended;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_suspended: next } : u)));
    const result = await suspendUserAction(user.id, next);
    if (!result.success) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_suspended: !next } : u)));
      toast.error('حدث خطأ');
    } else {
      toast.success(next ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
    }
  }

  const filtered = users.filter(
    (u) => u.username.includes(search.toLowerCase()) || u.full_name.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
        <Input placeholder="دور عن مستخدم..." className="pr-11" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="glass overflow-hidden rounded-3xl">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-200/30 text-right text-xs text-brand-500/70 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">المستخدم</th>
              <th className="px-4 py-3 font-medium">الرسائل</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-brand-200/20 last:border-0 dark:border-white/5">
                <td className="flex items-center gap-2 px-4 py-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-brand-500/10">
                    {user.avatar_url && (
                      <Image src={user.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-brand-950 dark:text-white">{user.full_name}</p>
                    <p className="text-xs text-brand-500" dir="ltr">@{user.username}</p>
                  </div>
                </td>
                <td className="px-4 py-3">{user.message_count}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.is_suspended
                        ? 'rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-500'
                        : 'rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-600'
                    }
                  >
                    {user.is_suspended ? 'موقوف' : 'نشط'}
                  </span>
                </td>
                <td className="px-4 py-3 text-left">
                  {!user.is_admin && (
                    <Button
                      variant={user.is_suspended ? 'secondary' : 'destructive'}
                      size="sm"
                      onClick={() => handleToggleSuspend(user)}
                    >
                      {user.is_suspended ? 'تفعيل' : 'إيقاف'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
