'use client';

import { useState } from 'react';
import { updateSettingsAction } from '@/actions/settings';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-brand-950 dark:text-white">{label}</p>
        <p className="text-xs text-brand-500/70">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-500' : 'bg-brand-200 dark:bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'right-0.5' : 'right-5'
          )}
        />
      </button>
    </div>
  );
}

export function PreferencesPanel({
  initialAllowMessages,
  initialEmailNotifications,
}: {
  initialAllowMessages: boolean;
  initialEmailNotifications: boolean;
}) {
  const [allowMessages, setAllowMessages] = useState(initialAllowMessages);
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const { theme, setTheme } = useTheme();

  async function persist(next: Partial<{ allowMessages: boolean; emailNotifications: boolean }>) {
    const merged = {
      allowMessages: next.allowMessages ?? allowMessages,
      emailNotifications: next.emailNotifications ?? emailNotifications,
      theme,
    };
    const result = await updateSettingsAction(merged);
    if (!result.success) toast.error('حدث خطأ أثناء الحفظ');
  }

  return (
    <div className="divide-y divide-brand-200/30 dark:divide-white/10">
      <ToggleRow
        label="استقبال رسائل جديدة"
        description="لو مقفول، محدش هيقدر يبعتلك رسايل جديدة"
        checked={allowMessages}
        onChange={(v) => { setAllowMessages(v); persist({ allowMessages: v }); }}
      />
      <ToggleRow
        label="إشعارات البريد الإلكتروني"
        description="هيوصلك إيميل عند وصول رسالة جديدة"
        checked={emailNotifications}
        onChange={(v) => { setEmailNotifications(v); persist({ emailNotifications: v }); }}
      />
      <div className="py-3">
        <p className="mb-2 text-sm font-medium text-brand-950 dark:text-white">المظهر</p>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-medium',
                theme === t ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
              )}
            >
              {t === 'light' ? 'فاتح' : t === 'dark' ? 'غامق' : 'حسب النظام'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
