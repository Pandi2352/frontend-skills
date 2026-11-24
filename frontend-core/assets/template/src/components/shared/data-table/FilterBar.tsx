import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/fields/text/TagsInput';
import { Drawer } from '@/components/ui/modal';
import { uiText } from '@/constants/ui-text';
import { useDisclosure } from '@/hooks/useDisclosure';

export interface FilterBarProps {
  /** The filter fields. They all share the same height. */
  children: ReactNode;
  active?: { id: string; label: string; onRemove: () => void }[];
  onClearAll?: () => void;
}

/** In a row on desktop, in a drawer on phones. */
export function FilterBar({ children, active = [], onClearAll }: FilterBarProps) {
  const drawer = useDisclosure();
  return (
    <div className="flex flex-col gap-2">
      <div className="hidden items-start gap-3 md:grid md:grid-cols-3 lg:grid-cols-4">{children}</div>
      <Button variant="outline" leftIcon={SlidersHorizontal} className="self-start md:hidden" aria-haspopup="dialog" onClick={drawer.open}>
        {uiText.filters}
        {active.length > 0 && ` (${active.length})`}
      </Button>
      <Drawer
        open={drawer.isOpen}
        onClose={drawer.close}
        side="bottom"
        title={uiText.filters}
        footer={
          <>
            {onClearAll && <Button variant="outline" onClick={onClearAll}>{uiText.clearAll}</Button>}
            <Button onClick={drawer.close}>{uiText.apply}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">{children}</div>
      </Drawer>
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((f) => (
            <Chip key={f.id} label={f.label} onRemove={f.onRemove} />
          ))}
          {onClearAll && (
            <Button size="sm" variant="link" className="px-1" onClick={onClearAll}>
              {uiText.clearAll}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
