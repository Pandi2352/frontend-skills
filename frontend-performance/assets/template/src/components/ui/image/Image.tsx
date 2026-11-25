import { ImageOff } from 'lucide-react';
import { useState, type ImgHTMLAttributes, type Ref } from 'react';
import { cn } from '@/lib/cn';

type Native = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src' | 'width' | 'height' | 'loading'>;

export interface ImageProps extends Native {
  src: string;
  /** "" when it is only decoration. */
  alt: string;
  /** Real pixel size of the file. Reserves the space, so nothing jumps. */
  width: number;
  height: number;
  /** Smaller or newer versions, best first: `{ type: 'image/avif', srcSet: '…' }`. */
  sources?: { type?: string; media?: string; srcSet: string; sizes?: string }[];
  /** For the main image at the top of the page. Use on one image only. */
  priority?: boolean;
  fit?: 'cover' | 'contain';
  ref?: Ref<HTMLImageElement>;
}

/** Image that reserves its space, loads late when it is below, and survives a missing file. */
export function Image(props: ImageProps) {
  const {
    src, alt, width, height, sources = [], priority = false, fit = 'cover', className, onLoad, onError, ref, ...rest
  } = props;
  const [status, setStatus] = useState({ src: '', value: '' });
  const now = status.src === src ? status.value : 'loading';

  return (
    <span
      style={{ aspectRatio: `${width} / ${height}` }}
      className={cn('relative block w-full overflow-hidden rounded-md bg-subtle', className)}
    >
      {now === 'failed' ? (
        <span
          {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
          className="flex size-full items-center justify-center text-muted"
        >
          <ImageOff aria-hidden className="size-6" />
        </span>
      ) : (
        <picture>
          {sources.map((s) => (
            <source key={`${s.media ?? ''}${s.type ?? ''}${s.srcSet}`} {...s} />
          ))}
          <img
            decoding="async"
            {...rest}
            ref={ref}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={(event) => {
              setStatus({ src, value: 'loaded' });
              onLoad?.(event);
            }}
            onError={(event) => {
              setStatus({ src, value: 'failed' });
              onError?.(event);
            }}
            className={cn(
              'size-full',
              fit === 'cover' ? 'object-cover' : 'object-contain',
              // The main image is never hidden, because fading it in delays LCP.
              !priority && 'transition-opacity duration-150',
              !priority && now === 'loading' && 'opacity-0',
            )}
          />
        </picture>
      )}
    </span>
  );
}
