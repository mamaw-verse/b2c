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

    return (
        <div
            className={cn(
                'flex overflow-hidden rounded-card border bg-surface',
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
            <div className="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pr-2 pl-3">
                <p className="text-label">{title}</p>
                {min && (
                    <p className="text-body-sm text-muted-foreground">{min}</p>
                )}
                <p
                    className={cn(
                        'flex items-center gap-1 text-caption',
                        state === 'unavailable'
                            ? 'text-danger-text'
                            : 'text-muted-foreground',
                    )}
                >
                    {state === 'unavailable' ? (
                        <CircleAlert aria-hidden="true" className="size-3.5" />
                    ) : (
                        <Clock aria-hidden="true" className="size-3.5" />
                    )}
                    {state === 'unavailable' ? 'Not yet eligible' : expiry}
                </p>
            </div>
            {state === 'applied' ? (
                <div className="flex shrink-0 items-center pr-3">
                    <Badge variant="success">
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
                    >
                        {state === 'claimed' ? 'Use' : 'Claim'}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
