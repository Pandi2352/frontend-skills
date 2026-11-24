import { Search } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { setNativeValue } from '@/utils/dom';
import { Input, type InputProps } from './Input';

export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  /** Runs after typing stops, and at once on Enter or clear. */
  onSearch?: (text: string) => void;
  debounceMs?: number;
}

export function SearchInput(props: SearchInputProps) {
  const { onSearch, debounceMs = 300, onChange, onKeyDown, ...rest } = props;
  const search = useDebouncedCallback((text: string) => onSearch?.(text), debounceMs);

  return (
    <Input
      clearable
      autoComplete="off"
      enterKeyHint="search"
      {...rest}
      type="search"
      leftIcon={Search}
      onChange={(event) => {
        search(event.target.value);
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSearch?.(event.currentTarget.value);
        if (event.key === 'Escape' && event.currentTarget.value) {
          event.preventDefault();
          setNativeValue(event.currentTarget, '');
        }
        onKeyDown?.(event);
      }}
    />
  );
}
