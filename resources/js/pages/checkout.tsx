import { Head, router } from '@inertiajs/react';
import { CircleAlert, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { AddressCard, type AddressData } from '@/components/address-card';
import { AddressForm, type AddressFormData } from '@/components/address-form';
import {
    OrderSummary,
    type OrderSummaryLine,
} from '@/components/order-summary';
import {
    PaymentMethodPicker,
    type PaymentMethodItem,
} from '@/components/payment-method-picker';
import {
    ShippingOptionPicker,
    type ShippingOptionItem,
} from '@/components/shipping-option-picker';
import { Modal } from '@/components/ui/modal';
import { VoucherPicker, type VoucherItem } from '@/components/voucher-picker';
import { formatPeso } from '@/lib/format';

type CheckoutGroup = {
    shop: {
        id: string;
        name: string;
        slug: string;
        verification?: string | null;
        halal_only?: boolean;
    };
    items: Array<{
        id: string;
        product_id: string;
        slug: string;
        name: string;
        icon?: string;
        halal_status?: string;
        certifier?: string | null;
        frozen?: boolean;
        variation?: { id: string; label: string } | null;
        qty: number;
        unit_price: number;
        subtotal: number;
    }>;
};

type CheckoutPageProps = {
    groups: CheckoutGroup[];
    addresses: AddressData[];
    defaultAddress: AddressData | null;
    shippingOptions: ShippingOptionItem[];
    paymentMethods: PaymentMethodItem[];
    summary: {
        subtotal: number;
        shippingFee: number;
        shippingDiscount: number;
        voucherDiscount: number;
        platformVoucherDiscount: number;
        codFee: number;
        total: number;
        itemCount: number;
        isHalal: boolean;
        lines: OrderSummaryLine[];
    };
    availableVouchers: VoucherItem[];
};

export default function Checkout({
    groups,
    addresses,
    defaultAddress,
    shippingOptions,
    paymentMethods,
    summary,
    availableVouchers,
}: CheckoutPageProps) {
    const [selectedAddressId, setSelectedAddressId] = useState<string>(
        defaultAddress?.id ?? addresses[0]?.id ?? '',
    );
    const [addressPickerOpen, setAddressPickerOpen] = useState(false);
    const [addAddressOpen, setAddAddressOpen] = useState(false);
    const [addressFormErrors, setAddressFormErrors] = useState<
        Record<string, string>
    >({});

    const [selectedShippingId, setSelectedShippingId] = useState<string>(
        shippingOptions[0]?.id ?? '',
    );
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
        paymentMethods[0]?.id ?? '',
    );
    const [notes, setNotes] = useState('');

    const [voucherPickerOpen, setVoucherPickerOpen] = useState(false);
    const [selectedVouchers, setSelectedVouchers] = useState<
        Record<string, string | null>
    >({
        shop: null,
        platform: null,
        shipping: null,
    });

    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const currentAddress =
        addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;
    const currentShipping =
        shippingOptions.find((s) => s.id === selectedShippingId) ??
        shippingOptions[0];

    // Compute dynamic client summary lines
    const subtotal = summary?.subtotal ?? 0;
    const shippingFee = currentShipping?.fee ?? summary?.shippingFee ?? 0;
    const selectedMethod = paymentMethods.find(
        (m) => m.id === selectedPaymentMethod,
    );
    const codFee = selectedMethod?.fee ?? 0;

    // Voucher discounts
    let voucherDiscount = 0;
    let shippingDiscount = 0;
    let platformDiscount = 0;

    if (selectedVouchers.shop) {
        const v = availableVouchers.find(
            (item) => item.id === selectedVouchers.shop,
        );
        if (v) voucherDiscount = v.discount_value;
    }
    if (selectedVouchers.shipping) {
        const v = availableVouchers.find(
            (item) => item.id === selectedVouchers.shipping,
        );
        if (v) shippingDiscount = Math.min(shippingFee, v.discount_value);
    }
    if (selectedVouchers.platform) {
        const v = availableVouchers.find(
            (item) => item.id === selectedVouchers.platform,
        );
        if (v) platformDiscount = v.discount_value;
    }

    const calculatedTotal = Math.max(
        0,
        subtotal +
            shippingFee -
            shippingDiscount -
            voucherDiscount -
            platformDiscount +
            codFee,
    );

    const summaryLines: OrderSummaryLine[] = [
        {
            label: `Merchandise subtotal (${summary?.itemCount ?? 1} items)`,
            amount: subtotal,
        },
        { label: 'Shipping fee', amount: shippingFee },
    ];
    if (shippingDiscount > 0) {
        summaryLines.push({
            label: 'Shipping discount',
            amount: -shippingDiscount,
        });
    }
    if (voucherDiscount > 0) {
        summaryLines.push({ label: 'Shop voucher', amount: -voucherDiscount });
    }
    if (platformDiscount > 0) {
        summaryLines.push({
            label: 'Platform voucher',
            amount: -platformDiscount,
        });
    }
    if (codFee > 0) {
        summaryLines.push({ label: 'Cash on Delivery fee', amount: codFee });
    }

    const handleCreateAddress = (data: AddressFormData) => {
        router.post('/account/addresses', data, {
            preserveScroll: true,
            onSuccess: () => {
                setAddAddressOpen(false);
                setAddressPickerOpen(false);
            },
            onError: (errors) => setAddressFormErrors(errors),
        });
    };

    const handlePlaceOrder = () => {
        if (!selectedAddressId) {
            setFormErrors({ address: 'Please select a delivery address.' });
            return;
        }
        if (!selectedPaymentMethod) {
            setFormErrors({ payment: 'Please select a payment method.' });
            return;
        }

        setSubmitting(true);
        setFormErrors({});

        router.post(
            '/checkout',
            {
                address_id: selectedAddressId,
                shipping_option_id: selectedShippingId,
                payment_method: selectedPaymentMethod,
                shop_voucher_id: selectedVouchers.shop,
                platform_voucher_id:
                    selectedVouchers.platform || selectedVouchers.shipping,
                notes: notes.trim() || null,
            },
            {
                onError: (errors) => {
                    setSubmitting(false);
                    setFormErrors(errors);
                },
            },
        );
    };

    return (
        <>
            <Head title="Checkout" />

            <div className="mx-auto max-w-7xl px-gutter py-4 pb-28 md:px-6 md:py-6 lg:pb-8">
                <h1 className="mb-4 text-h2">Checkout</h1>

                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Main flow column */}
                    <div className="grid gap-4 lg:col-span-8">
                        {/* 1. Delivery address */}
                        <section aria-labelledby="co-address-h">
                            <h2 id="co-address-h" className="sr-only">
                                Delivery Address
                            </h2>
                            {currentAddress ? (
                                <AddressCard
                                    address={currentAddress}
                                    onChange={() => setAddressPickerOpen(true)}
                                />
                            ) : (
                                <div className="panel flex items-center justify-between p-4">
                                    <p className="text-body text-muted-foreground">
                                        No delivery address on file.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setAddAddressOpen(true)}
                                        className="btn btn-primary"
                                    >
                                        Add address
                                    </button>
                                </div>
                            )}
                            {formErrors.address && (
                                <p className="mt-1 flex items-center gap-1 text-body-sm font-bold text-danger">
                                    <CircleAlert className="size-4 shrink-0" />
                                    <span>{formErrors.address}</span>
                                </p>
                            )}
                        </section>

                        {/* 2. Items per shop */}
                        <section
                            aria-labelledby="co-items-h"
                            className="grid gap-4"
                        >
                            <h2 id="co-items-h" className="text-h4">
                                Order Items
                            </h2>
                            {groups.map((group) => (
                                <div
                                    key={group.shop.id}
                                    className="panel overflow-hidden"
                                >
                                    <div className="border-b border-border bg-surface-subtle px-4 py-2 text-label font-bold">
                                        {group.shop.name}
                                    </div>
                                    <ul className="divide-y divide-border px-4">
                                        {group.items.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 py-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="line-clamp-1 text-body font-medium">
                                                        {item.name}
                                                    </p>
                                                    {item.variation && (
                                                        <p className="text-body-sm text-muted-foreground">
                                                            {
                                                                item.variation
                                                                    .label
                                                            }
                                                        </p>
                                                    )}
                                                    <p className="text-body-sm text-muted-foreground">
                                                        Qty: {item.qty} ×{' '}
                                                        {formatPeso(
                                                            item.unit_price,
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="tabular text-label font-bold">
                                                    {formatPeso(item.subtotal)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </section>

                        {/* 3. Shipping option */}
                        <section
                            aria-labelledby="co-shipping-h"
                            className="panel p-4"
                        >
                            <h2 id="co-shipping-h" className="sr-only">
                                Shipping Option
                            </h2>
                            <ShippingOptionPicker
                                options={shippingOptions}
                                value={selectedShippingId}
                                onChange={setSelectedShippingId}
                            />
                        </section>

                        {/* 4. Vouchers */}
                        {availableVouchers.length > 0 && (
                            <section
                                aria-labelledby="co-voucher-h"
                                className="panel p-4"
                            >
                                <h2 id="co-voucher-h" className="sr-only">
                                    Vouchers
                                </h2>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Ticket className="size-5 text-sale" />
                                        <div>
                                            <p className="text-label">
                                                Shop & Platform Vouchers
                                            </p>
                                            <p className="text-body-sm text-muted-foreground">
                                                {selectedVouchers.shop ||
                                                selectedVouchers.platform ||
                                                selectedVouchers.shipping
                                                    ? 'Vouchers applied'
                                                    : 'Apply coupons for discounts'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setVoucherPickerOpen(true)
                                        }
                                        className="btn btn-outline"
                                    >
                                        Select vouchers
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* 5. Payment method */}
                        <section
                            aria-labelledby="co-payment-h"
                            className="panel p-4"
                        >
                            <h2 id="co-payment-h" className="sr-only">
                                Payment Method
                            </h2>
                            <PaymentMethodPicker
                                methods={paymentMethods}
                                value={selectedPaymentMethod}
                                onChange={setSelectedPaymentMethod}
                                error={formErrors.payment}
                            />
                        </section>

                        {/* Optional notes */}
                        <section className="panel grid gap-1.5 p-4">
                            <label
                                htmlFor="co-notes"
                                className="text-label text-foreground"
                            >
                                Order notes{' '}
                                <span className="text-body-sm font-normal text-muted-foreground">
                                    (Optional)
                                </span>
                            </label>
                            <textarea
                                id="co-notes"
                                className="field"
                                rows={2}
                                placeholder="Any special instructions for the rider or sellers..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </section>
                    </div>

                    {/* Summary column (desktop) */}
                    <div className="sticky top-20 hidden lg:col-span-4 lg:block">
                        <OrderSummary
                            lines={summaryLines}
                            total={calculatedTotal}
                            cod={selectedPaymentMethod === 'cod'}
                            halal={summary?.isHalal}
                            title="Payment details"
                        >
                            <button
                                type="button"
                                onClick={handlePlaceOrder}
                                disabled={submitting}
                                aria-busy={submitting}
                                className="btn btn-primary min-h-touch-primary w-full text-center"
                            >
                                {submitting
                                    ? 'Placing order...'
                                    : 'Place order'}
                            </button>
                        </OrderSummary>
                    </div>
                </div>
            </div>

            {/* Sticky bar for mobile */}
            <div className="z-sticky shadow-panel fixed inset-x-0 bottom-[var(--tabbar-h,4rem)] border-t border-border bg-surface p-gutter pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] md:px-6 lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div>
                        <p className="text-caption text-muted-foreground">
                            Total payment
                        </p>
                        <p
                            className="tabular text-price font-extrabold text-sale"
                            aria-live="polite"
                        >
                            {formatPeso(calculatedTotal)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        aria-busy={submitting}
                        className="btn btn-primary min-h-touch-primary px-8"
                    >
                        {submitting ? 'Placing order...' : 'Place order'}
                    </button>
                </div>
            </div>

            {/* Address picker modal */}
            <Modal
                open={addressPickerOpen}
                onOpenChange={setAddressPickerOpen}
                title="Select delivery address"
                kind="responsive"
            >
                <div className="grid gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setAddressPickerOpen(false);
                            setAddAddressOpen(true);
                        }}
                        className="btn btn-outline flex min-h-touch w-full items-center justify-center gap-1.5"
                    >
                        <Plus className="size-4" />
                        <span>Add new address</span>
                    </button>

                    <div className="grid gap-2">
                        {addresses.map((addr) => (
                            <AddressCard
                                key={addr.id}
                                address={addr}
                                select
                                selected={selectedAddressId === addr.id}
                                onSelect={() => {
                                    setSelectedAddressId(addr.id);
                                    setAddressPickerOpen(false);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Add address modal */}
            <Modal
                open={addAddressOpen}
                onOpenChange={setAddAddressOpen}
                title="Add new address"
                kind="responsive"
            >
                <AddressForm
                    onSubmit={handleCreateAddress}
                    onCancel={() => setAddAddressOpen(false)}
                    errors={addressFormErrors}
                />
            </Modal>

            {/* Voucher Picker modal */}
            <VoucherPicker
                open={voucherPickerOpen}
                onOpenChange={setVoucherPickerOpen}
                vouchers={availableVouchers}
                selected={selectedVouchers}
                onSelect={(kind, id) =>
                    setSelectedVouchers((prev) => ({ ...prev, [kind]: id }))
                }
                totalSavings={
                    shippingDiscount + voucherDiscount + platformDiscount
                }
            />
        </>
    );
}
