<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Enums\DiscountType;
use App\Enums\HalalStatus;
use App\Enums\VoucherKind;
use App\Models\CartItem;
use App\Models\ShippingOption;
use App\Models\User;
use App\Models\Voucher;

final readonly class ComputeCartTotals
{
    /**
     * @return array{
     *     subtotal: int,
     *     shippingFee: int,
     *     shippingDiscount: int,
     *     voucherDiscount: int,
     *     platformVoucherDiscount: int,
     *     codFee: int,
     *     total: int,
     *     itemCount: int,
     *     isHalal: bool,
     *     lines: list<array{label: string, amount: int}>
     * }
     */
    public function handle(
        User $user,
        ?Voucher $shopVoucher = null,
        ?Voucher $platformVoucher = null,
        ?ShippingOption $shippingOption = null,
        ?string $paymentMethod = null
    ): array {
        $items = CartItem::with(['product.halalCertification', 'variation'])
            ->where('user_id', $user->id)
            ->where('selected', true)
            ->get();

        $subtotal = 0;
        $itemCount = 0;
        $isHalal = $items->isNotEmpty();

        foreach ($items as $item) {
            $price = $item->variation->price ?? $item->product->price;
            $subtotal += $price * $item->qty;
            $itemCount += $item->qty;

            if ($item->product->halal_status !== HalalStatus::Certified) {
                $isHalal = false;
            }
        }

        // Determine shipping fee
        $shopCount = $items->pluck('product.shop_id')->unique()->count();
        $shippingFee = 0;
        if ($shippingOption !== null) {
            $shippingFee = $shippingOption->fee * $shopCount;
        } elseif ($items->isNotEmpty()) {
            // Default shipping fee per shop represented in selected items
            $shippingFee = config()->integer('checkout.default_shipping_fee') * $shopCount;
        }

        // Calculate discounts
        $shippingDiscount = 0;
        $voucherDiscount = 0;
        $platformVoucherDiscount = 0;

        // Check if platform voucher is a shipping voucher
        if ($platformVoucher !== null && $platformVoucher->kind === VoucherKind::Shipping) {
            $shippingDiscount = $this->calculateDiscount($platformVoucher, $shippingFee);
            $shippingDiscount = min($shippingDiscount, $shippingFee);
        } elseif ($platformVoucher !== null && $platformVoucher->kind === VoucherKind::Platform) {
            $platformVoucherDiscount = $this->calculateDiscount($platformVoucher, $subtotal);
        }

        if ($shopVoucher !== null && $shopVoucher->kind === VoucherKind::Shop) {
            $shopSubtotal = $items->filter(fn (CartItem $i) => $i->product->shop_id === $shopVoucher->shop_id)
                ->sum(fn (CartItem $i) => ($i->variation->price ?? $i->product->price) * $i->qty);

            $voucherDiscount = $this->calculateDiscount($shopVoucher, $shopSubtotal);
        }

        $codFee = ($paymentMethod === 'cod') ? config()->integer('checkout.cod_fee') * $shopCount : 0;

        $total = max(0, $subtotal + $shippingFee - $shippingDiscount - $voucherDiscount - $platformVoucherDiscount + $codFee);

        $lines = [
            ['label' => "Merchandise subtotal ({$itemCount} items)", 'amount' => $subtotal],
            ['label' => 'Shipping fee', 'amount' => $shippingFee],
        ];

        if ($shippingDiscount > 0) {
            $lines[] = ['label' => 'Shipping discount', 'amount' => -$shippingDiscount];
        }
        if ($voucherDiscount > 0) {
            $lines[] = ['label' => 'Shop voucher', 'amount' => -$voucherDiscount];
        }
        if ($platformVoucherDiscount > 0) {
            $lines[] = ['label' => 'Platform voucher', 'amount' => -$platformVoucherDiscount];
        }
        if ($codFee > 0) {
            $lines[] = ['label' => 'Cash on Delivery fee', 'amount' => $codFee];
        }

        return [
            'subtotal' => $subtotal,
            'shippingFee' => $shippingFee,
            'shippingDiscount' => $shippingDiscount,
            'voucherDiscount' => $voucherDiscount,
            'platformVoucherDiscount' => $platformVoucherDiscount,
            'codFee' => $codFee,
            'total' => $total,
            'itemCount' => $itemCount,
            'isHalal' => $isHalal,
            'lines' => $lines,
        ];
    }

    private function calculateDiscount(Voucher $voucher, int $amount): int
    {
        if ($amount <= 0) {
            return 0;
        }

        if ($voucher->discount_type === DiscountType::Fixed) {
            return min($amount, $voucher->discount_value);
        }

        // Percentage discount
        $discount = (int) round($amount * ($voucher->discount_value / 100));
        if ($voucher->max_discount !== null) {
            $discount = min($discount, $voucher->max_discount);
        }

        return $discount;
    }
}
