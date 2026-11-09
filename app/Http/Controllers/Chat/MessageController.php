<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Actions\Chat\SendMessage;
use App\Enums\MessageType;
use App\Http\Requests\Chat\CreateMessageRequest;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

final class MessageController
{
    public function store(CreateMessageRequest $request, Conversation $conversation, SendMessage $action): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $product = $request->validated('product_id') ? Product::whereKey($request->validated('product_id'))->first() : null;
        $order = $request->validated('order_id') ? Order::whereKey($request->validated('order_id'))->first() : null;
        $type = MessageType::tryFrom($request->validated('type') ?? 'text') ?? MessageType::Text;

        $message = $action->handle(
            $user,
            $conversation,
            $request->validated('body'),
            $type,
            $product,
            $order
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message->load(['product', 'order']),
            ], 201);
        }

        return back();
    }
}
