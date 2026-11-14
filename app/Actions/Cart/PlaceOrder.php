<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Actions\Finance\ResolveCommissionRate;
use App\Actions\Seller\ResolveAffiliateRate;
use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\VoucherKind;
use App\Models\Address;
use App\Models\AffiliateProfile;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\ShippingOption;
use App\Models\User;
use App\Models\Voucher;
use App\Notifications\SellerOrderNotification;
use App\Support\Money;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

final readonly class PlaceOrder
{
    public function __construct(
        private ResolveCommissionRate $commission,
        private ResolveAffiliateRate $affiliateRate,
    ) {}

    /**
     * @return Order|Collection<int, Order>
     */
    public function handle(
        User $user,
        Address $address,
        ShippingOption $shippingOption,
        string $paymentMethod,
        ?Voucher $shopVoucher = null,
        ?Voucher $platformVoucher = null,
        ?string $notes = null,
        ?string $affiliateCode = null
    ): Order|Collection {
        $paymentEnum = PaymentMethod::tryFrom($paymentMethod) ?? PaymentMethod::Cod;

        return DB::transaction(function () use (
            $user,
            $address,
            $shippingOption,
            $paymentEnum,
            $shopVoucher,
            $platformVoucher,
            $notes,
            $affiliateCode
        ): Order|Collection {
            $items = CartItem::with(['product', 'variation'])
                ->where('user_id', $user->id)
                ->where('selected', true)
                ->get();

            if ($items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Your cart has no selected items.',
                ]);
            }

            $createdOrders = [];
            $shopGroups = $items->groupBy('product.shop_id');
            $shopCount = $shopGroups->count();

            $cookieRef = request()->cookie('affiliate_ref');
            $ref = $affiliateCode ?? (is_string($cookieRef) ? $cookieRef : null);
            $affiliateProfile = null;
            if ($ref !== null && $ref !== '') {
                $affiliateProfile = AffiliateProfile::active()->where('code', $ref)->first();
            }

            foreach ($shopGroups as $shopId => $groupItems) {
                $subtotal = 0;
                $orderItemsData = [];

                foreach ($groupItems as $item) {
                    if ($item->product_variation_id !== null) {
                        /** @var ProductVariation|null $variation */
                        $variation = ProductVariation::where('id', $item->product_variation_id)
                            ->lockForUpdate()
                            ->first();

                        if ($variation === null || $variation->stock < $item->qty) {
                            throw ValidationException::withMessages([
                                'stock' => "Product \"{$item->product->name}\" variation is out of stock.",
                            ]);
                        }

                        $variation->decrement('stock', $item->qty);
                        $unitPrice = $variation->price ?? $item->product->price;
                        $variationLabel = mb_trim("{$variation->option1_value} {$variation->option2_value}");
                    } else {
                        /** @var Product|null $product */
                        $product = Product::where('id', $item->product_id)
                            ->lockForUpdate()
                            ->first();

                        if ($product === null || $product->stock < $item->qty) {
                            throw ValidationException::withMessages([
                                'stock' => "Product \"{$item->product->name}\" is out of stock.",
                            ]);
                        }

                        $product->decrement('stock', $item->qty);
                        $unitPrice = $product->price;
                        $variationLabel = null;
                    }

                    // Increment sold count
                    $item->product->increment('sold_count', $item->qty);

                    $lineSubtotal = $unitPrice * $item->qty;
                    $subtotal += $lineSubtotal;

                    $commissionBps = $this->commission->handle($item->product->category);

                    $affiliateProfileId = null;
                    $affiliateBps = 0;
                    $affiliateAmount = 0;

                    if ($affiliateProfile !== null
                        && $affiliateProfile->user_id !== $user->id
                        && $affiliateProfile->user_id !== $item->product->shop->user_id
                        && ! $item->product->shop->staff()->where('user_id', $affiliateProfile->user_id)->where('status', 'active')->exists()
                    ) {
                        $rate = $this->affiliateRate->handle($item->product);
                        if ($rate !== null && $rate > 0) {
                            $affiliateProfileId = $affiliateProfile->id;
                            $affiliateBps = $rate;
                            $affiliateAmount = (int) round($lineSubtotal * $rate / 10000);
                        }
                    }

                    $orderItemsData[] = [
                        'product_id' => $item->product_id,
                        'product_variation_id' => $item->product_variation_id,
                        'product_name' => $item->product->name,
                        'variation_label' => $variationLabel,
                        'unit_price' => $unitPrice,
                        'qty' => $item->qty,
                        'subtotal' => $lineSubtotal,
                        'commission_bps' => $commissionBps,
                        'commission_amount' => (int) round($lineSubtotal * $commissionBps / 10000),
                        'affiliate_profile_id' => $affiliateProfileId,
                        'affiliate_bps' => $affiliateBps,
                        'affiliate_amount' => $affiliateAmount,
                    ];
                }

                $shippingFee = $shippingOption->fee;
                $shippingDiscount = 0;
                $voucherDiscount = 0;
                $platformVoucherDiscount = 0;

                // Shop voucher discount
                $appliedShopVoucher = null;
                if ($shopVoucher !== null && $shopVoucher->shop_id === $shopId) {
                    $appliedShopVoucher = $shopVoucher;
                    $voucherDiscount = $this->calculateDiscount($shopVoucher, $subtotal);
                    $shopVoucher->increment('used_count');
                }

                // Platform voucher discount (split evenly across shops if multiple)
                $appliedPlatformVoucher = null;
                if ($platformVoucher !== null) {
                    $appliedPlatformVoucher = $platformVoucher;
                    if ($platformVoucher->kind === VoucherKind::Shipping) {
                        $shippingDiscount = min($shippingFee, $this->calculateDiscount($platformVoucher, $shippingFee));
                    } else {
                        $fullDiscount = $this->calculateDiscount($platformVoucher, $subtotal);
                        $platformVoucherDiscount = intdiv($fullDiscount, max(1, $shopCount));
                    }
                    $platformVoucher->increment('used_count');
                }

                $codFee = ($paymentEnum === PaymentMethod::Cod) ? config()->integer('checkout.cod_fee') : 0;
                $total = max(0, $subtotal + $shippingFee - $shippingDiscount - $voucherDiscount - $platformVoucherDiscount + $codFee);

                $status = ($paymentEnum === PaymentMethod::Cod)
                    ? OrderStatus::ToShip
                    : OrderStatus::Pending;

                /** @var Order $order */
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'address_id' => $address->id,
                    'shipping_option_id' => $shippingOption->id,
                    'voucher_id' => $appliedShopVoucher?->id,
                    'platform_voucher_id' => $appliedPlatformVoucher?->id,
                    'payment_method' => $paymentEnum,
                    'status' => $status,
                    'subtotal' => $subtotal,
                    'shipping_fee' => $shippingFee,
                    'shipping_discount' => $shippingDiscount,
                    'voucher_discount' => $voucherDiscount,
                    'platform_voucher_discount' => $platformVoucherDiscount,
                    'total' => $total,
                    'cod_fee' => $codFee,
                    'notes' => $notes,
                ]);

                foreach ($orderItemsData as $orderItem) {
                    OrderItem::create($orderItem + ['order_id' => $order->id]);
                }

                Payment::create([
                    'order_id' => $order->id,
                    'method' => $paymentEnum->value,
                    'status' => PaymentStatus::Pending,
                    'reference' => 'PAY-'.mb_strtoupper(mb_substr($order->id, -8)),
                    'amount' => $total,
                ]);

                $user->notify(new \App\Notifications\OrderStatusNotification(
                    $order,
                    'Order placed',
                    "Order #{$order->id} placed. Total ".Money::format($total),
                ));

                DB::afterCommit(fn () => Notification::send($order->shop->operators(), new SellerOrderNotification($order, 'created')));

                $createdOrders[] = $order;
            }

            // Remove selected cart items
            CartItem::where('user_id', $user->id)->where('selected', true)->delete();

            return count($createdOrders) === 1 ? $createdOrders[0] : new Collection($createdOrders);
        });
    }

    private function calculateDiscount(Voucher $voucher, int $amount): int
    {
        if ($amount <= 0) {
            return 0;
        }

        if ($voucher->discount_type === DiscountType::Fixed) {
            return min($amount, $voucher->discount_value);
        }

        $discount = (int) round($amount * ($voucher->discount_value / 100));
        if ($voucher->max_discount !== null) {
            $discount = min($discount, $voucher->max_discount);
        }

        return $discount;
    }
}
