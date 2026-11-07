import { cn } from '@/lib/utils';

const tones = [
    'bg-brand-100 text-brand-800',
    'bg-info-soft text-info',
    'bg-sale-soft text-sale',
    'bg-warning-soft text-warning',
    'bg-success-soft text-success',
];

const sizes = {
    sm: 'size-8 text-caption',
    md: 'size-10 text-label',
    lg: 'size-14 text-h4',
    xl: 'size-20 text-h3',
};

type NameAvatarProps = {
    name: string;
    size?: keyof typeof sizes;
    shape?: 'circle' | 'tile';
    status?: 'online' | 'offline' | null;
    label?: boolean;
    className?: string;
};

/** DS avatar: deterministic tone from name, initials fallback. */
export function NameAvatar({
    name,
    size = 'md',
    shape = 'circle',
    status,
    label = true,
    className,
}: NameAvatarProps) {
    const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const tone =
        tones[
            name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) %
                tones.length
        ];

    return (
        <span
            role={label ? 'img' : undefined}
            aria-label={label ? name : undefined}
            aria-hidden={label ? undefined : true}
            className={cn(
                'relative inline-grid shrink-0 place-items-center font-bold',
                shape === 'circle' ? 'rounded-full' : 'rounded-tile',
                sizes[size],
                tone,
                className,
            )}
        >
            <span aria-hidden="true">{initials}</span>
            {status && (
                <>
                    <span
                        className={cn(
                            'absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface',
                            status === 'online'
                                ? 'bg-success'
                                : 'bg-border-control',
                        )}
                    />
                    <span className="sr-only">, {status}</span>
                </>
            )}
        </span>
    );
}
