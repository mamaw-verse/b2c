<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Cart\ComputeCartTotals;
use App\Actions\Cart\PlaceOrder;
use App\Http\Requests\CreateCheckoutRequest;
use App\Http\Requests\ShowCheckoutRequest;
use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\ShippingOption;
use App\Models\User;
use App\Models\Voucher;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class CheckoutController
{
    public function show(ShowCheckoutRequest $request, ComputeCartTotals $computeTotals): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $items = CartItem::with(['product.shop', 'product.images', 'product.halalCertification', 'variation'])
            ->where('user_id', $user->id)
            ->where('selected', true)
            ->get();

        $groups = $items->groupBy('product.shop_id')->map(function ($shopItems) {
            $shop = $shopItems->first()->product->shop;

            return [
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'verification' => $shop->verification,
                    'halal_only' => $shop->halal_only,
                ],
                'items' => $shopItems->map(function (CartItem $item) {
                    $variation = $item->variation;
                    $product = $item->product;

                    return [
                        'id' => $item->id,
                        'product_id' => $product->id,
                        'slug' => $product->slug,
                        'name' => $product->name,
                        'icon' => $product->images->isEmpty() ? 'package' : $product->images->first()->icon,
                        'image_url' => $product->images->first()?->url,
                        'halal_status' => $product->halal_status->value,
                        'certifier' => $product->halalCertification?->certifying_body,
                        'frozen' => $product->frozen,
                        'variation' => $variation ? [
                            'id' => $variation->id,
                            'label' => mb_trim("{$variation->option1_value} {$variation->option2_value}"),
                        ] : null,
                        'qty' => $item->qty,
                        'unit_price' => $variation?->price ?? $product->price,
                        'subtotal' => ($variation?->price ?? $product->price) * $item->qty,
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        $addresses = Address::where('user_id', $user->id)
            ->with(['region', 'province', 'city', 'barangay'])
            ->orderByDesc('is_default')
            ->latest('created_at')
            ->get()
            ->map(fn (Address $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'phone' => $a->phone,
                'region_code' => $a->region_code,
                'province_code' => $a->province_code,
                'city_code' => $a->city_code,
                'barangay_code' => $a->barangay_code,
                'street' => $a->street,
                'postal_code' => $a->postal_code,
                'landmark' => $a->landmark,
                'label' => $a->label->value,
                'is_default' => $a->is_default,
                'formatted' => $a->formattedAddress(),
            ]);

        $defaultAddress = $addresses->firstWhere('is_default', true) ?? $addresses->first();

        $shippingOptions = ShippingOption::where('is_active', true)
            ->get()
            ->map(fn (ShippingOption $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'description' => $s->description,
                'icon' => $s->icon ?? 'truck',
                'fee' => $s->fee,
                'is_cold_chain' => $s->is_cold_chain,
                'eta' => $s->eta_days_min && $s->eta_days_max ? "{$s->eta_days_min}-{$s->eta_days_max} days" : null,
            ]);

        $defaultShipping = ShippingOption::where('is_active', true)->first();
        $summary = $computeTotals->handle($user, null, null, $defaultShipping);

        $codFee = (int) config('checkout.cod_fee');
        $paymentMethods = collect(config('checkout.payment_methods', []))
            ->map(function (array $method) use ($codFee): array {
                $isCod = $method['id'] === 'cod';

                return [
                    'id' => $method['id'],
                    'label' => $method['label'],
                    'desc' => $isCod
                        ? $method['desc'].' '.Money::format($codFee).' COD fee.'
                        : $method['desc'],
                    'icon' => $method['icon'],
                    'fee' => $isCod ? $codFee : 0,
                ];
            })
            ->all();

        $availableVouchers = Voucher::where('is_active', true)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->get()
            ->map(fn (Voucher $v) => [
                'id' => $v->id,
                'shop_id' => $v->shop_id,
                'code' => $v->code,
                'kind' => $v->kind->value,
                'discount_type' => $v->discount_type->value,
                'discount_value' => $v->discount_value,
                'max_discount' => $v->max_discount,
                'min_spend' => $v->min_spend,
                'expires_at' => $v->expires_at?->format('M d'),
            ]);

        return Inertia::render('checkout', [
            'groups' => $groups,
            'addresses' => $addresses,
            'defaultAddress' => $defaultAddress,
            'shippingOptions' => $shippingOptions,
            'paymentMethods' => $paymentMethods,
            'summary' => $summary,
            'availableVouchers' => $availableVouchers,
        ]);
    }

    public function store(CreateCheckoutRequest $request, PlaceOrder $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        /** @var Address $address */
        $address = Address::findOrFail($request->input('address_id'));
        /** @var ShippingOption $shippingOption */
        $shippingOption = ShippingOption::findOrFail($request->input('shipping_option_id'));

        $shopVoucher = $request->filled('shop_voucher_id')
            ? Voucher::find($request->input('shop_voucher_id'))
            : null;

        $platformVoucher = $request->filled('platform_voucher_id')
            ? Voucher::find($request->input('platform_voucher_id'))
            : null;

        $result = $action->handle(
            $user,
            $address,
            $shippingOption,
            (string) $request->input('payment_method'),
            $shopVoucher,
            $platformVoucher,
            $request->input('notes')
        );

        $order = $result instanceof Order ? $result : $result->first();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your order has been placed successfully!']);

        return redirect()->route('order-confirmed', $order);
    }
}
