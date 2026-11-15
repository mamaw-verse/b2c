import { Check, Clock, CircleAlert, Store, Tag, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tones = {
    shop: ['bg-primary text-primary-foreground', Store, 'Shop'],
    platform: ['bg-promo-solid-bg text-primary-foreground', Tag, 'Platform'],
    shipping: ['bg-success text-primary-foreground', Truck, 'Shipping'],
} as const;

type VoucherCardProps = {
    title: string;
    min?: string | null;
    expiry?: string;
    kind?: keyof typeof tones;
    state?: 'available' | 'claimed' | 'applied' | 'unavailable';
    onAction?: () => void;
};

export function VoucherCard({
    title,
    min,
    expiry,
    kind = 'shop',
    state = 'available',
    onAction,
}: VoucherCardProps) {
    const [toneClasses, Icon, label] =
        state === 'unavailable'
            ? [
                  'bg-surface-muted text-muted-foreground',
                  tones[kind][1],
                  tones[kind][2],
              ]
            : tones[kind];

    const subtitle =
        state === 'unavailable'
            ? min
                ? `${min} · Not yet eligible`
                : 'Not yet eligible'
            : min
              ? `${min} · ${expiry}`
              : expiry || 'No expiry';

    return (
        <div
            className={cn(
                'flex h-full w-full min-h-[4.5rem] overflow-hidden rounded-card border bg-surface',
                state === 'unavailable'
                    ? 'border-border'
                    : 'border-border-outline',
            )}
        >
            <div
                className={cn(
                    'flex w-20 shrink-0 flex-col items-center justify-center gap-1 p-2 text-center text-caption font-bold',
                    toneClasses,
                )}
            >
                <Icon aria-hidden="true" />
                <span className="line-clamp-2 break-words">{label}</span>
            </div>
            <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-l-2 border-dashed border-border py-2 pr-2 pl-3">
                <p
                    className="text-label font-semibold text-foreground truncate"
                    title={title}
                    aria-label={title}
                >
                    {title}
                </p>
                <p
                    className={cn(
                        'text-caption truncate',
                        state === 'unavailable'
                            ? 'text-danger-text'
                            : 'text-muted-foreground',
                    )}
                    title={subtitle}
                    aria-label={subtitle}
                >
                    {subtitle}
                </p>
            </div>
            {state === 'applied' ? (
                <div className="flex shrink-0 items-center pr-3">
                    <Badge variant="success" className="min-w-[72px] justify-center">
                        <Check aria-hidden="true" className="size-3.5" />
                        Applied
                    </Badge>
                </div>
            ) : state !== 'unavailable' ? (
                <div className="flex shrink-0 items-center pr-3">
                    <Button
                        size="sm"
                        variant={state === 'claimed' ? 'outline' : 'primary'}
                        onClick={onAction}
                        className="min-w-[72px] w-[72px] shrink-0"
                    >
                        {state === 'claimed' ? 'Use' : 'Claim'}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
