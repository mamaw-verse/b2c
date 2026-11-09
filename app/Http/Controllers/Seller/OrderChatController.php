<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Chat\StartConversation;
use App\Http\Requests\Seller\CreateSellerOrderChatRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class OrderChatController
{
    public function store(CreateSellerOrderChatRequest $request, Order $order, StartConversation $action): RedirectResponse
    {
        $conversation = $action->handle($order->user, $request->user()->shop);

        return redirect()->route('seller.chat.show', $conversation);
    }
}
