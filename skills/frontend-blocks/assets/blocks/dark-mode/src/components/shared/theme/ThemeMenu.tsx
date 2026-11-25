import { Monitor, Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { RadioGroup } from '@/components/ui/fields/choice/RadioGroup';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';

export const themeText = { theme: 'Theme', light: 'Light', dark: 'Dark', system: 'Like the device' };
const choices = [
  { value: 'light' as const, icon: Sun },
  { value: 'dark' as const, icon: Moon },
  { value: 'system' as const, icon: Monitor },
];

/** For the navbar. */
export function ThemeMenu() {
  const { choice, theme, setChoice } = useTheme();
  return (
    <DropdownMenu
      items={choices.map(({ value, icon }) => ({
        label: themeText[value], icon, checked: choice === value, onSelect: () => setChoice(value),
      }))}
      trigger={(props) => <IconButton icon={theme === 'dark' ? Moon : Sun} label={themeText.theme} {...props} />}
    />
  );
}

/** For the settings page. */
export function ThemeField() {
  const { choice, setChoice } = useTheme();
  return (
    <RadioGroup<ThemeChoice>
      label={themeText.theme}
      variant="card"
      direction="horizontal"
      value={choice}
      onChange={(next) => next && setChoice(next)}
      options={choices.map(({ value, icon }) => ({ value, icon, label: themeText[value] }))}
    />
  );
}
