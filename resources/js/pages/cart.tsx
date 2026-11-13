import { Head, Link, router } from '@inertiajs/react';
import { ShoppingBag, Ticket } from 'lucide-react';
import { useState } from 'react';
import type { CartItemData } from '@/components/cart-item';
import {
    CartShopGroup,
    type CartShopGroupData,
} from '@/components/cart-shop-group';
import { OrderSummary } from '@/components/order-summary';
import { EmptyState } from '@/components/ui/empty-state';
import { VariationPicker } from '@/components/variation-picker';
import { VoucherPicker, type VoucherItem } from '@/components/voucher-picker';
import { formatPeso } from '@/lib/format';
import { show as checkout } from '@/routes/checkout';

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
    const [editingItem, setEditingItem] = useState<CartItemData | null>(null);
    const [selectedVouchers, setSelectedVouchers] = useState<
        Record<string, string | null>
    >({
        shop: null,
        platform: null,
        shipping: null,
    });

    const allItems = groups.flatMap((g) => g.items);
    const availableItems = allItems.filter((i) => !i.unavailable);
    const hasUnavailableSelection = allItems.some(
        (i) => i.selected && i.unavailable,
    );
    const checkoutBlocked = selectedCount === 0 || hasUnavailableSelection;
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

    const handleVariationItem = (itemId: string) => {
        const item = allItems.find((i) => i.id === itemId);
        if (item && item.variations && item.variations.length > 0) {
            setEditingItem(item);
        }
    };

    const handleConfirmVariation = (selection: {
        option1: string;
        option2: string | null;
        variation?: { id: string } | null;
    }) => {
        if (!editingItem) return;

        const variation =
            selection.variation ??
            editingItem.variations?.find(
                (v) =>
                    v.option1_value === selection.option1 &&
                    (v.option2_value ?? null) === (selection.option2 ?? null),
            );

        if (!variation) return;

        router.put(
            `/cart/${editingItem.id}`,
            { product_variation_id: variation.id },
            {
                preserveScroll: true,
                onSuccess: () => setEditingItem(null),
            },
        );
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

    const allVouchers: VoucherItem[] = [...platformVouchers];

    const isCartEmpty = groups.length === 0;

    return (
        <>
            <Head title="Shopping Cart" />

            <div className="py-4 pb-28 md:py-6 lg:pb-8">
                <h1 className="mb-4 text-h2">
                    Shopping Cart{' '}
                    {allItems.length > 0 && (
                        <span className="text-body font-normal text-muted-foreground">
                            ({allItems.length} items)
                        </span>
                    )}
                </h1>

                {hasUnavailableSelection && (
                    <p
                        role="alert"
                        className="panel mb-4 p-4 text-body-sm text-danger-text"
                    >
                        Some selected items are unavailable or exceed current
                        stock. Reduce their quantity, remove them, or deselect
                        them to continue.
                    </p>
                )}

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
                                        className="ml-auto inline-flex items-center gap-1.5 text-body-sm text-primary-text hover:underline"
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
                                    onVariationItem={handleVariationItem}
                                    onRemoveItem={handleRemoveItem}
                                    onVoucherClick={() =>
                                        setVoucherPickerOpen(true)
                                    }
                                />
                            ))}
                        </div>

                        {/* Summary column (desktop) */}
                        <div className="hidden lg:col-span-4 lg:block lg:self-stretch">
                            <OrderSummary
                                className="sticky top-20"
                                lines={[
                                    {
                                        label: `Merchandise subtotal (${selectedCount} items)`,
                                        amount: selectedTotal,
                                    },
                                ]}
                                total={selectedTotal}
                                title="Order summary"
                            >
                                <button
                                    type="button"
                                    onClick={() => router.visit(checkout())}
                                    disabled={checkoutBlocked}
                                    className="btn btn-primary min-h-touch-primary w-full text-center"
                                >
                                    Proceed to Checkout ({selectedCount})
                                </button>
                            </OrderSummary>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky bar for mobile / phone */}
            {!isCartEmpty && (
                <div className="z-sticky shadow-panel fixed inset-x-0 bottom-[var(--tabbar-h,4rem)] border-t border-border bg-surface p-gutter lg:hidden">
                    <div className="mx-auto flex max-w-container items-center justify-between gap-3">
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
                                className="tabular text-price font-extrabold text-foreground"
                                aria-live="polite"
                            >
                                {formatPeso(selectedTotal)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.visit(checkout())}
                            disabled={checkoutBlocked}
                            className="btn btn-primary min-h-touch-primary px-6 text-center"
                        >
                            Checkout ({selectedCount})
                        </button>
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

            {editingItem && (
                <VariationPicker
                    key={editingItem.id}
                    open={Boolean(editingItem)}
                    onOpenChange={(open) => {
                        if (!open) setEditingItem(null);
                    }}
                    mode="edit"
                    initial={{
                        option1: editingItem.variation?.option1_value,
                        option2: editingItem.variation?.option2_value,
                    }}
                    confirmLabel="Update"
                    product={{
                        ...editingItem,
                        price: editingItem.unit_price,
                        icon: editingItem.icon ?? 'package',
                        option1_name: editingItem.option1_name ?? null,
                        option2_name: editingItem.option2_name ?? null,
                        variations: editingItem.variations ?? [],
                    }}
                    onConfirm={handleConfirmVariation}
                />
            )}
        </>
    );
}
