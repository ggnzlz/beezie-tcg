import Image from 'next/image';

import { cn } from '@/lib/utils';

interface ItemImageProps {
  src: string;
  /** Full title, used as the accessible name when the visible one is clamped. */
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function ItemImage({ src, alt, sizes, className, priority = false }: ItemImageProps) {
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-lg bg-white', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain"
      />
    </div>
  );
}
