<?php

declare(strict_types=1);

namespace App\Values;

use App\Models\Order;

final readonly class OrderTotals
{
    public function __construct(
        public int $subtotal,
        public int $shipping,
        public int $shippingDiscount,
        public int $voucherDiscount,
        public int $platformVoucherDiscount,
        public int $codFee,
        public int $total,
    ) {
        assert(
            $this->total === max(
                0,
                $this->subtotal
                    + $this->shipping
                    - $this->shippingDiscount
                    - $this->voucherDiscount
                    - $this->platformVoucherDiscount
                    + $this->codFee,
            ),
        );
    }

    public static function forOrder(Order $order): self
    {
        return new self(
            subtotal: $order->subtotal,
            shipping: $order->shipping_fee,
            shippingDiscount: $order->shipping_discount,
            voucherDiscount: $order->voucher_discount,
            platformVoucherDiscount: $order->platform_voucher_discount,
            codFee: $order->cod_fee,
            total: $order->total,
        );
    }

    public function discount(): int
    {
        return $this->shippingDiscount + $this->voucherDiscount + $this->platformVoucherDiscount;
    }

    /** @return array{subtotal: int, shipping: int, shipping_discount: int, voucher_discount: int, platform_voucher_discount: int, cod_fee: int, total: int} */
    public function toArray(): array
    {
        return [
            'subtotal' => $this->subtotal,
            'shipping' => $this->shipping,
            'shipping_discount' => $this->shippingDiscount,
            'voucher_discount' => $this->voucherDiscount,
            'platform_voucher_discount' => $this->platformVoucherDiscount,
            'cod_fee' => $this->codFee,
            'total' => $this->total,
        ];
    }
}
