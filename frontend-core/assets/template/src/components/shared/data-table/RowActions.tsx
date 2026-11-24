import { EllipsisVertical } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { DropdownMenu, type MenuItem } from '@/components/ui/dropdown-menu';
import { uiText } from '@/constants/ui-text';

export function RowActions({ name, items }: { name: string; items: MenuItem[] }) {
  if (!items.length) return null;
  return (
    <DropdownMenu
      items={items}
      trigger={(props) => <IconButton icon={EllipsisVertical} size="sm" label={uiText.actionsFor(name)} {...props} />}
    />
  );
}
