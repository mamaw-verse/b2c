import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, Ticket } from 'lucide-react';
import { useState } from 'react';
import {
    CartShopGroup,
    type CartShopGroupData,
} from '@/components/cart-shop-group';
import { OrderSummary } from '@/components/order-summary';
import { EmptyState } from '@/components/ui/empty-state';
import { VoucherPicker, type VoucherItem } from '@/components/voucher-picker';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

type CartPageProps = {
    groups: CartShopGroupData[];
    selectedCount: number;
    selectedTotal: number;
    platformVouchers: VoucherItem[];
};

export default function Cart({
    groups,
    selectedCount,
    selectedTotal,
    platformVouchers,
}: CartPageProps) {
    const [voucherPickerOpen, setVoucherPickerOpen] = useState(false);
    const [selectedVouchers, setSelectedVouchers] = useState<
        Record<string, string | null>
    >({
        shop: null,
        platform: null,
        shipping: null,
    });

    const allItems = groups.flatMap((g) => g.items);
    const availableItems = allItems.filter((i) => !i.unavailable);
    const isAllSelected =
        availableItems.length > 0 && availableItems.every((i) => i.selected);

    const handleToggleAll = (selected: boolean) => {
        const itemIds = availableItems.map((i) => i.id);
        if (itemIds.length === 0) return;
        router.put(
            '/cart-selection',
            { item_ids: itemIds, selected },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleSelectGroup = (group: CartShopGroupData, selected: boolean) => {
        const itemIds = group.items
            .filter((i) => !i.unavailable)
            .map((i) => i.id);
        if (itemIds.length === 0) return;
        router.put(
            '/cart-selection',
            { item_ids: itemIds, selected },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleSelectItem = (itemId: string, selected: boolean) => {
        router.put(
            '/cart-selection',
            { item_ids: [itemId], selected },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleQtyChange = (itemId: string, qty: number) => {
        router.put(
            `/cart/${itemId}`,
            { qty },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleRemoveItem = (itemId: string) => {
        router.delete(`/cart/${itemId}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleApplyVoucherCode = async (code: string) => {
        await new Promise<void>((resolve, reject) => {
            router.post(
                '/cart/vouchers',
                { code },
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: (errors) =>
                        reject(
                            new Error(errors.code || 'Failed to apply voucher'),
                        ),
                },
            );
        });
    };

    const allVouchers: VoucherItem[] = [
        ...platformVouchers,
        ...groups.flatMap((g) => (g as any).availableVouchers ?? []),
    ];

    const isCartEmpty = groups.length === 0;

    return (
        <>
            <Head title="Shopping Cart" />

            <div className="mx-auto max-w-7xl px-gutter py-4 pb-28 md:px-6 md:py-6 lg:pb-8">
                <h1 className="mb-4 text-h2">
                    Shopping Cart{' '}
                    {allItems.length > 0 && (
                        <span className="text-body font-normal text-muted-foreground">
                            ({allItems.length} items)
                        </span>
                    )}
                </h1>

                {isCartEmpty ? (
                    <div className="panel p-8 text-center">
                        <EmptyState
                            icon={ShoppingBag}
                            title="Your cart is empty"
                            text="Explore certified halal food, modest fashion, and lifestyle products."
                            action={
                                <Link
                                    href="/"
                                    className="btn btn-primary min-h-touch-primary"
                                >
                                    Start shopping
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                        {/* Cart items column */}
                        <div className="grid gap-4 lg:col-span-8">
                            {/* Select all header on desktop */}
                            <div className="hidden items-center gap-2 rounded-panel border border-border bg-surface px-4 py-3 md:flex">
                                <label className="flex cursor-pointer items-center gap-2 text-body font-medium">
                                    <input
                                        type="checkbox"
                                        className="size-5 accent-primary"
                                        checked={isAllSelected}
                                        disabled={availableItems.length === 0}
                                        onChange={(e) =>
                                            handleToggleAll(e.target.checked)
                                        }
                                    />
                                    <span>
                                        Select all ({availableItems.length}{' '}
                                        items)
                                    </span>
                                </label>

                                {allVouchers.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setVoucherPickerOpen(true)
                                        }
                                        className="ml-auto inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline"
                                    >
                                        <Ticket
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        <span>Platform vouchers</span>
                                    </button>
                                )}
                            </div>

                            {/* Groups */}
                            {groups.map((group) => (
                                <CartShopGroup
                                    key={group.shop.id}
                                    group={group}
                                    onSelectAll={(sel) =>
                                        handleSelectGroup(group, sel)
                                    }
                                    onSelectItem={handleSelectItem}
                                    onQtyItem={handleQtyChange}
                                    onRemoveItem={handleRemoveItem}
                                    onVoucherClick={() =>
                                        setVoucherPickerOpen(true)
                                    }
                                />
                            ))}
                        </div>

                        {/* Summary column (desktop) */}
                        <div className="sticky top-20 hidden lg:col-span-4 lg:block">
                            <OrderSummary
                                lines={[
                                    {
                                        label: `Merchandise subtotal (${selectedCount} items)`,
                                        amount: selectedTotal,
                                    },
                                ]}
                                total={selectedTotal}
                                title="Order summary"
                            >
                                <Link
                                    href="/checkout"
                                    className={cn(
                                        'btn btn-primary min-h-touch-primary w-full text-center',
                                        selectedCount === 0 &&
                                            'pointer-events-none opacity-50',
                                    )}
                                >
                                    Proceed to Checkout ({selectedCount})
                                </Link>
                            </OrderSummary>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky bar for mobile / phone */}
            {!isCartEmpty && (
                <div className="z-sticky shadow-panel fixed inset-x-0 bottom-[var(--tabbar-h,4rem)] border-t border-border bg-surface p-gutter md:px-6">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                className="size-5 accent-primary"
                                checked={isAllSelected}
                                disabled={availableItems.length === 0}
                                onChange={(e) =>
                                    handleToggleAll(e.target.checked)
                                }
                            />
                            <span className="text-body-sm font-medium">
                                All
                            </span>
                        </label>

                        <div className="text-right">
                            <p className="text-caption text-muted-foreground">
                                Total ({selectedCount} items)
                            </p>
                            <p
                                className="tabular text-price font-extrabold text-sale"
                                aria-live="polite"
                            >
                                {formatPeso(selectedTotal)}
                            </p>
                        </div>

                        <Link
                            href="/checkout"
                            className={cn(
                                'btn btn-primary min-h-touch-primary px-6 text-center',
                                selectedCount === 0 &&
                                    'pointer-events-none opacity-50',
                            )}
                        >
                            Checkout ({selectedCount})
                        </Link>
                    </div>
                </div>
            )}

            <VoucherPicker
                open={voucherPickerOpen}
                onOpenChange={setVoucherPickerOpen}
                vouchers={allVouchers}
                selected={selectedVouchers}
                onSelect={(kind, id) =>
                    setSelectedVouchers((prev) => ({ ...prev, [kind]: id }))
                }
                onApplyCode={handleApplyVoucherCode}
            />
        </>
    );
}
