<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Cart\AddToCart;
use App\Actions\Cart\RemoveCartItem;
use App\Actions\Cart\UpdateCartItemQty;
use App\Actions\Cart\UpdateCartItemVariation;
use App\Http\Requests\CreateCartItemRequest;
use App\Http\Requests\DeleteCartItemRequest;
use App\Http\Requests\ListCartRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class CartController
{
    public function index(ListCartRequest $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $items = CartItem::with(['product.shop', 'product.images', 'product.halalCertification', 'product.variations', 'variation'])
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->get();

        $groups = $items->groupBy('product.shop_id')->map(function ($shopItems) {
            $firstItem = $shopItems->first();
            $shop = $firstItem->product->shop;

            $mappedItems = $shopItems->map(function (CartItem $item) {
                $product = $item->product;
                $variation = $item->variation;

                $stock = $variation ? $variation->stock : $product->stock;
                $unavailableReason = $item->availabilityWarning();

                $variationLabel = $variation
                    ? mb_trim(implode(' · ', array_filter([$variation->option1_value, $variation->option2_value], fn (?string $v) => $v !== null && $v !== '')))
                    : null;

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
                    'option1_name' => $product->option1_name,
                    'option2_name' => $product->option2_name,
                    'variations' => $product->variations->map(fn (ProductVariation $v) => [
                        'id' => $v->id,
                        'option1_value' => $v->option1_value,
                        'option2_value' => $v->option2_value,
                        'price' => $v->price,
                        'was_price' => $v->was_price,
                        'stock' => $v->stock,
                    ])->values()->all(),
                    'variation' => $variation ? [
                        'id' => $variation->id,
                        'option1_value' => $variation->option1_value,
                        'option2_value' => $variation->option2_value,
                        'label' => $variationLabel,
                    ] : null,
                    'qty' => $item->qty,
                    'stock' => $stock,
                    'unit_price' => $variation->price ?? $product->price,
                    'was_price' => $variation->was_price ?? $product->was_price,
                    'selected' => $item->selected,
                    'unavailable' => $unavailableReason,
                ];
            })->values()->all();

            $shopVouchers = Voucher::where('shop_id', $shop->id)
                ->where('is_active', true)
                ->get();

            return [
                'shop' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'verification' => $shop->verification,
                    'halal_only' => $shop->halal_only,
                ],
                'items' => $mappedItems,
                'selectedCount' => collect($mappedItems)->where('selected', true)->whereNull('unavailable')->sum('qty'),
                'totalCount' => collect($mappedItems)->count(),
                'voucherLabel' => $shopVouchers->isNotEmpty() ? "Shop voucher: {$shopVouchers->first()->code}" : null,
                'availableVouchers' => $shopVouchers,
            ];
        })->values()->all();

        $selectedItems = $items->filter(fn (CartItem $item) => $item->selected && $item->availabilityWarning() === null);
        $selectedCount = $selectedItems->sum('qty');
        $selectedTotal = $selectedItems->sum(fn ($i) => ($i->variation->price ?? $i->product->price) * $i->qty);

        $platformVouchers = Voucher::whereNull('shop_id')->where('is_active', true)->get();

        return Inertia::render('cart', [
            'groups' => $groups,
            'selectedCount' => $selectedCount,
            'selectedTotal' => $selectedTotal,
            'platformVouchers' => $platformVouchers,
        ]);
    }

    public function store(CreateCartItemRequest $request, AddToCart $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        /** @var Product $product */
        $product = Product::findOrFail($request->input('product_id'));
        $variation = $request->filled('product_variation_id')
            ? ProductVariation::whereKey($request->input('product_variation_id'))->firstOrFail()
            : null;

        $action->handle(
            $user,
            $product,
            $variation,
            (int) $request->input('qty', 1)
        );

        return back();
    }

    public function update(
        UpdateCartItemRequest $request,
        CartItem $cart,
        UpdateCartItemQty $qtyAction,
        UpdateCartItemVariation $variationAction
    ): RedirectResponse {
        $user = $request->user();
        assert($user instanceof User);

        if ($request->filled('product_variation_id')) {
            /** @var ProductVariation $variation */
            $variation = ProductVariation::whereKey($request->input('product_variation_id'))->firstOrFail();
            $variationAction->handle($user, $cart, $variation);
        } else {
            $qtyAction->handle($user, $cart, (int) $request->input('qty'));
        }

        return back();
    }

    public function destroy(DeleteCartItemRequest $request, CartItem $cart, RemoveCartItem $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user, $cart);

        return back();
    }
}
