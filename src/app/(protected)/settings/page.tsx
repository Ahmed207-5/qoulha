import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/form-elements';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';
import { PasswordSettingsForm } from '@/components/settings/password-settings-form';
import { PreferencesPanel } from '@/components/settings/preferences-panel';
import { DangerZone } from '@/components/settings/danger-zone';
import type { Profile } from '@/types/domain';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الإعدادات' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-brand-950 dark:text-white">الإعدادات</h1>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-brand-950 dark:text-white">الملف الشخصي</h2>
        <ProfileSettingsForm profile={profile as Profile} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-brand-950 dark:text-white">كلمة المرور</h2>
        <PasswordSettingsForm />
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 font-display text-sm font-bold text-brand-950 dark:text-white">التفضيلات</h2>
        <PreferencesPanel
          initialAllowMessages={settings?.allow_messages ?? true}
          initialEmailNotifications={settings?.email_notifications ?? true}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-brand-950 dark:text-white">منطقة الخطر</h2>
        <DangerZone />
      </Card>
    </div>
  );
}
