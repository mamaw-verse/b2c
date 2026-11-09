import { Link } from '@inertiajs/react';
import { DsIcon } from '@/components/ds-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface OrderRowProps {
    id: string;
    buyer: string;
    items: number;
    total: number;
    status: string;
    statusVariant?: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
    due?: string | null;
    urgent?: boolean;
    pay: string;
    thumbnailIcon?: string;
    selected?: boolean;
    onSelect?: (checked: boolean) => void;
    onAction?: () => void;
    actionLabel?: string;
    detailUrl: string;
    className?: string;
}

export function OrderRow({
    id,
    buyer,
    items,
    total,
    status,
    statusVariant,
    due,
    urgent = false,
    pay,
    thumbnailIcon = 'package',
    selected = false,
    onSelect,
    onAction,
    actionLabel,
    detailUrl,
    className,
}: OrderRowProps) {
    const normalizedStatus = status.toLowerCase();
    const badgeVariant =
        statusVariant ??
        (normalizedStatus === 'to ship'
            ? 'warning'
            : normalizedStatus === 'shipped' ||
                normalizedStatus === 'to receive'
              ? 'info'
              : 'success');
    const resolvedActionLabel =
        actionLabel ??
        (normalizedStatus === 'to ship' ? 'Arrange shipment' : 'View order');

    return (
        <li
            className={cn(
                'relative grid gap-3 bg-surface p-3 has-[:checked]:bg-primary-soft md:grid-cols-[auto_4rem_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-4 md:px-4',
                className,
            )}
        >
            {onSelect && (
                <label className="absolute top-2 right-2 grid size-11 place-items-center md:static">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => onSelect(e.target.checked)}
                        className="size-5 accent-primary"
                    />
                    <span className="sr-only">Select order {id}</span>
                </label>
            )}

            <div className="flex gap-3 md:contents">
                <div className="grid aspect-square w-14 shrink-0 place-items-center overflow-hidden rounded-tile bg-surface-muted text-muted-foreground md:w-16">
                    <DsIcon name={thumbnailIcon} className="size-6" />
                </div>
                <div className="grid min-w-0 gap-0.5 pr-10 md:pr-0">
                    <p className="text-label">
                        <Link
                            href={detailUrl}
                            className="text-primary-text underline"
                        >
                            {id}
                        </Link>
                    </p>
                    <p className="truncate text-body-sm text-muted-foreground">
                        {buyer} · {items} item{items > 1 ? 's' : ''} · {pay}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 md:contents">
                {due ? (
                    <p
                        className={cn(
                            'flex items-center gap-1 text-body-sm',
                            urgent
                                ? 'font-bold text-danger-text'
                                : 'text-muted-foreground',
                        )}
                    >
                        <DsIcon name="clock" className="size-4" />
                        {due}
                    </p>
                ) : (
                    <span />
                )}
                <p className="tabular text-price text-foreground md:text-right">
                    {formatPeso(total)}
                </p>
            </div>

            <div className="flex gap-2 md:justify-end">
                <Badge variant={badgeVariant} className="self-center md:hidden">
                    {status}
                </Badge>
                <span className="flex-1 md:hidden" />
                {onAction ? (
                    <Button
                        size="sm"
                        variant={
                            normalizedStatus === 'to ship'
                                ? 'default'
                                : 'neutral'
                        }
                        onClick={onAction}
                    >
                        {resolvedActionLabel}
                    </Button>
                ) : (
                    <Button
                        asChild
                        size="sm"
                        variant={
                            normalizedStatus === 'to ship'
                                ? 'default'
                                : 'neutral'
                        }
                    >
                        <Link href={detailUrl}>{resolvedActionLabel}</Link>
                    </Button>
                )}
            </div>
        </li>
    );
}

export function OrderActionBar({
    onShip,
    onPrint,
    onChat,
    fixed = true,
    canShip = true,
    isShipping = false,
}: {
    onShip?: () => void;
    onPrint?: () => void;
    onChat?: () => void;
    fixed?: boolean;
    canShip?: boolean;
    isShipping?: boolean;
}) {
    return (
        <div
            className={cn(
                fixed ? 'fixed inset-x-0 bottom-0 z-sticky-bar' : 'relative',
                'border-t border-border bg-surface pb-safe shadow-sticky lg:static lg:rounded-panel lg:border lg:pb-0 lg:shadow-none',
            )}
        >
            <div className="flex gap-2 px-gutter py-2 lg:justify-end lg:px-4 lg:py-3">
                <IconButton
                    icon="message-circle"
                    label="Chat with buyer"
                    variant="neutral"
                    onClick={onChat}
                />
                <Button
                    variant="neutral"
                    className="flex-1 lg:flex-none"
                    onClick={onPrint}
                >
                    <DsIcon name="printer" className="size-4" />
                    <span>Print waybill</span>
                </Button>
                {canShip && (
                    <Button
                        size="lg"
                        className="flex-1 lg:flex-none"
                        onClick={onShip}
                        disabled={isShipping}
                    >
                        {isShipping ? 'Processing...' : 'Arrange shipment'}
                    </Button>
                )}
            </div>
        </div>
    );
}
