import { router, usePage } from '@inertiajs/react';
import { ChevronRight, MessageCircle, Ticket } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { CartItem, type CartItemData } from '@/components/cart-item';
import { VerifiedBadge } from '@/components/verified-badge';
import { cn } from '@/lib/utils';
import { login } from '@/routes';

export type CartShopGroupData = {
    shop: {
        id: string;
        name: string;
        slug: string;
        verification?: string | null;
        halal_only?: boolean;
    };
    items: CartItemData[];
    selectedCount: number;
    totalCount: number;
    voucherLabel?: string | null;
};

type CartShopGroupProps = {
    group: CartShopGroupData;
    onSelectAll?: (selected: boolean) => void;
    onSelectItem?: (itemId: string, selected: boolean) => void;
    onQtyItem?: (itemId: string, qty: number) => void;
    onRemoveItem?: (itemId: string) => void;
    onVoucherClick?: () => void;
    className?: string;
};

export function CartShopGroup({
    group,
    onSelectAll,
    onSelectItem,
    onQtyItem,
    onRemoveItem,
    onVoucherClick,
    className,
}: CartShopGroupProps) {
    const { auth } = usePage().props;
    const checkboxRef = useRef<HTMLInputElement>(null);

    const handleChatClick = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        router.post('/account/chat', { shop_id: group.shop.id });
    };
    const headingId = `shop-group-${group.shop.id}-h`;

    const availableItems = group.items.filter((i) => !i.unavailable);
    const selectedAvailable = availableItems.filter((i) => i.selected);

    const isAllSelected =
        availableItems.length > 0 &&
        selectedAvailable.length === availableItems.length;
    const isPartiallySelected =
        selectedAvailable.length > 0 &&
        selectedAvailable.length < availableItems.length;

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isPartiallySelected;
        }
    }, [isPartiallySelected]);

    return (
        <section
            className={cn('panel overflow-hidden', className)}
            aria-labelledby={headingId}
        >
            <div className="flex items-center gap-2 border-b border-border bg-surface-subtle px-gutter py-2 md:px-4">
                <label className="grid min-h-touch min-w-9 cursor-pointer place-items-center">
                    <input
                        ref={checkboxRef}
                        type="checkbox"
                        className="size-5 accent-primary"
                        checked={isAllSelected}
                        disabled={availableItems.length === 0}
                        onChange={(e) => onSelectAll?.(e.target.checked)}
                    />
                    <span className="sr-only">
                        Select all items from {group.shop.name}
                    </span>
                </label>

                <a
                    href={`/shops/${group.shop.slug}`}
                    className="inline-flex items-center gap-1.5 text-label hover:underline"
                >
                    <span id={headingId}>{group.shop.name}</span>
                    {group.shop.verification && (
                        <VerifiedBadge
                            label={
                                group.shop.verification === 'official'
                                    ? 'Official Halal Store'
                                    : 'Accredited Merchant'
                            }
                            tone="soft"
                            size="sm"
                        />
                    )}
                </a>

                <button
                    type="button"
                    onClick={handleChatClick}
                    className="btn btn-ghost btn-icon -mr-2 ml-auto text-muted-foreground"
                    aria-label={`Chat with ${group.shop.name}`}
                >
                    <MessageCircle aria-hidden="true" className="size-4" />
                </button>
            </div>

            <ul className="divide-y divide-border px-4">
                {group.items.map((item) => (
                    <CartItem
                        key={item.id}
                        item={item}
                        onSelect={(sel) => onSelectItem?.(item.id, sel)}
                        onQty={(q) => onQtyItem?.(item.id, q)}
                        onRemove={() => onRemoveItem?.(item.id)}
                    />
                ))}
            </ul>

            {group.voucherLabel && (
                <button
                    type="button"
                    onClick={onVoucherClick}
                    className="flex min-h-touch w-full items-center gap-2 border-t border-border px-gutter text-body-sm hover:bg-surface-subtle md:px-4"
                >
                    <Ticket aria-hidden="true" className="size-4 text-promo" />
                    <span className="flex-1 text-left">
                        {group.voucherLabel}
                    </span>
                    <span className="font-medium text-primary-text">
                        More vouchers
                    </span>
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 text-muted-foreground"
                    />
                </button>
            )}
        </section>
    );
}
