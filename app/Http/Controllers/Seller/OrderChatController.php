<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Chat\StartConversation;
use App\Http\Requests\Seller\CreateSellerOrderChatRequest;
use App\Models\Order;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;

final class OrderChatController
{
    public function store(CreateSellerOrderChatRequest $request, Order $order, StartConversation $action): RedirectResponse
    {
        $shop = $request->user()->operatedShop();
        assert($shop instanceof Shop);
        $conversation = $action->handle($order->user, $shop);

        return redirect()->route('seller.chat.show', $conversation);
    }
}
