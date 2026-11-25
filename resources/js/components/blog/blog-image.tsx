import type { BlogImageData } from '@/types/blog';

type BlogImageProps = {
    image: BlogImageData;
    sizes: string;
    /** The LCP image: eager, high fetch priority. Everything else is lazy. */
    priority?: boolean;
    className?: string;
};

/** Responsive blog image from the generated variants; width/height are always set to avoid layout shift. */
export function BlogImage({
    image,
    sizes,
    priority = false,
    className,
}: BlogImageProps) {
    return (
        <img
            src={image.src}
            srcSet={image.srcset ?? undefined}
            sizes={image.srcset ? sizes : undefined}
            width={image.width}
            height={image.height}
            alt={image.alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            className={className}
        />
    );
}
