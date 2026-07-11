'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/form-elements';
import { Button } from '@/components/ui/button';
import { changePasswordAction } from '@/actions/settings';
import { toast } from 'sonner';

export function PasswordSettingsForm() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await changePasswordAction(password);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'حدث خطأ');
      return;
    }
    toast.success('تم تغيير كلمة المرور');
    setPassword('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1.5 block text-xs font-semibold text-brand-700/80 dark:text-brand-200/80">
          كلمة مرور جديدة
        </label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <Button type="submit" isLoading={loading}>تحديث</Button>
    </form>
  );
}
