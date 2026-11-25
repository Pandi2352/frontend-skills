import { Languages } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { changeLanguage, getLanguage, LANGUAGES, t, type LanguageCode } from '@/lib/i18n';

/** Each language in its own words, so people find theirs. */
export function LanguageMenu() {
  const codes = Object.keys(LANGUAGES) as LanguageCode[];
  return (
    <DropdownMenu
      items={codes.map((code) => ({
        label: LANGUAGES[code].label,
        checked: code === getLanguage(),
        onSelect: () => {
          if (code !== getLanguage()) changeLanguage(code);
        },
      }))}
      trigger={(props) => <IconButton icon={Languages} label={t('common.language')} {...props} />}
    />
  );
}
