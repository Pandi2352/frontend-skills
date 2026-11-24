import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/** Shows an image file and releases its memory afterwards. */
export function FilePreview(props: { file: File; alt: string; className?: string }) {
  const image = useRef<HTMLImageElement>(null);
  const { file, alt, className } = props;
  useEffect(() => {
    if (!image.current) return;
    const url = URL.createObjectURL(file);
    image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} alt={alt} className={cn('object-cover', className)} />;
}
