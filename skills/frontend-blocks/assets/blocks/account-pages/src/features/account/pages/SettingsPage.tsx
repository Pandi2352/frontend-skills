import { Bell, Lock, Palette, SlidersHorizontal } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { AsyncView } from '@/components/shared/states';
import { ThemeField } from '@/components/shared/theme';
import { Card } from '@/components/ui/card';
import { Switch, TimezoneSelect } from '@/components/ui/fields';
import { FormSkeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { useUrlState } from '@/hooks/useUrlState';
import { getErrorMessage } from '@/services/api-error';
import { usePreferences, useSetPreferences } from '../hooks/useProfile';
import type { Preferences } from '../services/profile.service';
import type { ReactNode } from 'react';

const switches = [
  { key: 'emailActivity', label: 'Activity by email', description: 'When something assigned to you changes' },
  { key: 'emailNews', label: 'News by email', description: 'New features, at most once a month' },
  { key: 'desktopAlerts', label: 'Alerts in the browser', description: 'While this app is open' },
] as const;

/** Settings apply at once; only the password has a form. */
function WithPreferences({ children }: { children: (data: Preferences, set: (changes: Partial<Preferences>) => void) => ReactNode }) {
  const preferences = usePreferences();
  const save = useSetPreferences();
  return (
    <AsyncView
      data={preferences.data}
      isLoading={preferences.isPending}
      error={preferences.error && getErrorMessage(preferences.error)}
      onRetry={() => void preferences.refetch()}
      loader={<FormSkeleton fields={2} />}
    >
      {(data) => children(data, (changes) => save.mutate(changes, { onError: (error) => toast.error(getErrorMessage(error)) }))}
    </AsyncView>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useUrlState<string>('tab', 'general');
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title="Settings" />
      <Tabs
        label="Settings"
        orientation="vertical"
        value={tab}
        onChange={setTab}
        items={[
          {
            id: 'general', label: 'General', icon: SlidersHorizontal,
            content: (
              <Card title="General">
                <WithPreferences>
                  {(data, set) => (
                    <TimezoneSelect label="Time zone" className="max-w-md" value={data.timezone} onChange={(timezone) => timezone && set({ timezone })} />
                  )}
                </WithPreferences>
              </Card>
            ),
          },
          { id: 'appearance', label: 'Appearance', icon: Palette, content: <Card title="Appearance"><ThemeField /></Card> },
          {
            id: 'notifications', label: 'Notifications', icon: Bell,
            content: (
              <Card title="Notifications">
                <WithPreferences>
                  {(data, set) => (
                    <div className="flex flex-col gap-4">
                      {switches.map(({ key, label, description }) => (
                        <Switch key={key} spread label={label} description={description} value={data[key]} onChange={(on) => set({ [key]: on })} />
                      ))}
                    </div>
                  )}
                </WithPreferences>
              </Card>
            ),
          },
          { id: 'security', label: 'Security', icon: Lock, content: <Card title="Change password"><ChangePasswordForm /></Card> },
        ]}
      />
    </PageContainer>
  );
}
