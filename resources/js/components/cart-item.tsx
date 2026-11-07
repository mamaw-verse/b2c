import { ChevronDown, Trash2 } from 'lucide-react';
import { HalalBadge } from '@/components/halal-badge';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { QuantityStepper } from '@/components/quantity-stepper';
import { cn } from '@/lib/utils';
import type { HalalStatus } from '@/types/catalogue';

export type CartItemData = {
    id: string;
    product_id: string;
    slug: string;
    name: string;
    icon?: string;
    halal_status?: string;
    certifier?: string | null;
    frozen?: boolean;
    variation?: {
        id: string;
        label: string;
    } | null;
    qty: number;
    stock: number;
    unit_price: number;
    was_price?: number | null;
    selected: boolean;
    unavailable?: string | null;
};

type CartItemProps = {
    item: CartItemData;
    onSelect?: (selected: boolean) => void;
    onQty?: (qty: number) => void;
    onVariation?: () => void;
    onRemove?: () => void;
    syncing?: boolean;
    className?: string;
};

export function CartItem({
    item,
    onSelect,
    onQty,
    onVariation,
    onRemove,
    syncing = false,
    className,
}: CartItemProps) {
    const isUnavailable = Boolean(item.unavailable);
    const lowStock = !isUnavailable && item.stock <= 5 && item.stock > 0;

    return (
        <li className={cn('flex gap-2 py-3', className)}>
            <label className="grid min-h-touch min-w-9 cursor-pointer content-start justify-items-center pt-6">
                <input
                    type="checkbox"
                    className="size-5 accent-primary disabled:cursor-not-allowed"
                    checked={item.selected && !isUnavailable}
                    disabled={isUnavailable}
                    onChange={(e) => onSelect?.(e.target.checked)}
                />
                <span className="sr-only">Select {item.name}</span>
            </label>

            <a
                href={`/products/${item.slug}`}
                className="w-20 shrink-0 overflow-hidden rounded-tile md:w-24"
                tabIndex={-1}
                aria-hidden="true"
            >
                <Media
                    label={item.name}
                    icon={item.icon ?? 'package'}
                    decorative
                />
            </a>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
                <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-body">
                        <a
                            href={`/products/${item.slug}`}
                            className="hover:underline"
                        >
                            {item.name}
                        </a>
                    </p>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label={`Remove ${item.name} from cart`}
                            className="-mr-1 p-1 text-muted-foreground hover:text-danger"
                        >
                            <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                    )}
                </div>

                {item.variation && (
                    <button
                        type="button"
                        onClick={onVariation}
                        className="relative inline-flex min-h-9 w-fit max-w-full items-center gap-1 rounded-badge bg-surface-muted px-2 text-body-sm text-muted-foreground after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-border"
                        aria-label={`Variation: ${item.variation.label}. Change`}
                    >
                        <span>{item.variation.label}</span>
                        <ChevronDown
                            aria-hidden="true"
                            className="size-4 shrink-0"
                        />
                    </button>
                )}

                {item.halal_status && (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <HalalBadge
                            status={item.halal_status as HalalStatus}
                            short
                            body={item.certifier}
                        />
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 [&>:last-child]:ml-auto">
                    <PriceBlock
                        price={item.unit_price}
                        was={item.was_price}
                        size="sm"
                    />

                    <QuantityStepper
                        value={item.qty}
                        min={1}
                        max={Math.max(1, item.stock)}
                        disabled={isUnavailable || syncing}
                        onChange={(q) => onQty?.(q)}
                    />
                </div>

                {lowStock && (
                    <p className="text-body-sm font-medium text-warning">
                        Only {item.stock} left
                    </p>
                )}

                {isUnavailable && (
                    <p className="text-body-sm font-medium text-danger">
                        {item.unavailable}
                    </p>
                )}
            </div>
        </li>
    );
}
