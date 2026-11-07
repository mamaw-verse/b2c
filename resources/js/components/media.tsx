import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';

const tones = [
    'bg-brand-100 text-brand-700',
    'bg-info-soft text-info',
    'bg-sale-soft text-sale',
    'bg-warning-soft text-warning',
    'bg-surface-muted text-muted-foreground',
    'bg-success-soft text-success',
];

type MediaProps = {
    label: string;
    icon?: string;
    src?: string | null;
    index?: number;
    ratio?: string;
    decorative?: boolean;
    className?: string;
};

/** Product/media component: renders real image when src is provided, falls back to neutral SVG placeholder. */
export function Media({
    label,
    icon = 'package',
    src,
    index = 0,
    ratio = 'aspect-square',
    decorative = false,
    className,
}: MediaProps) {
    if (src) {
        return (
            <div
                className={cn(
                    'relative grid w-full place-items-center overflow-hidden bg-surface-muted',
                    ratio,
                    className,
                )}
            >
                <img
                    src={src}
                    alt={decorative ? '' : label}
                    aria-hidden={decorative || undefined}
                    className="size-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div
            role={decorative ? undefined : 'img'}
            aria-label={decorative ? undefined : label}
            aria-hidden={decorative || undefined}
            className={cn(
                'grid w-full place-items-center overflow-hidden',
                ratio,
                tones[index % tones.length],
                className,
            )}
        >
            <DsIcon name={icon} className="size-1/3 max-w-16 stroke-[1.25]" />
        </div>
    );
}
