<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Actions\Chat\GetConversations;
use App\Actions\Chat\GetMessages;
use App\Actions\Chat\MarkConversationRead;
use App\Actions\Chat\StartConversation;
use App\Enums\Workspace;
use App\Http\Requests\Chat\CreateConversationRequest;
use App\Http\Requests\Chat\ListConversationsRequest;
use App\Http\Requests\Chat\ShowConversationRequest;
use App\Models\Conversation;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ConversationController
{
    public function index(ListConversationsRequest $request, GetConversations $action): Response|JsonResponse
    {
        $user = $request->user();
        $workspace = Workspace::fromRequest($request);
        $q = $request->validated('q');
        $conversations = $action->handle($user, is_string($q) ? $q : null, $workspace);

        if ($request->wantsJson()) {
            return response()->json([
                'conversations' => $conversations,
            ]);
        }

        return Inertia::render('chat', [
            'conversations' => $conversations,
            'activeConversation' => null,
            'messages' => [],
            'workspace' => $workspace->value,
        ]);
    }

    public function store(CreateConversationRequest $request, StartConversation $action): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        /** @var Shop $shop */
        $shop = Shop::findOrFail($request->validated('shop_id'));
        $product = $request->validated('product_id') ? Product::whereKey($request->validated('product_id'))->first() : null;

        $conversation = $action->handle(
            $user,
            $shop,
            $request->validated('initial_message'),
            $product
        );

        if ($request->wantsJson()) {
            return response()->json([
                'conversation' => $conversation->load(['shop', 'latestMessage']),
            ]);
        }

        return redirect()->route('chat.show', $conversation);
    }

    public function show(
        ShowConversationRequest $request,
        Conversation $conversation,
        GetConversations $conversationsAction,
        GetMessages $messagesAction,
        MarkConversationRead $readAction
    ): Response|JsonResponse {
        $user = $request->user();
        $workspace = Workspace::fromRequest($request);

        $readAction->handle($user, $conversation);
        $conversations = $conversationsAction->handle($user, workspace: $workspace);
        $messages = $messagesAction->handle($user, $conversation);

        $conversation->load('shop');

        if ($request->wantsJson()) {
            return response()->json([
                'conversation' => $conversation,
                'messages' => $messages,
            ]);
        }

        return Inertia::render('chat', [
            'conversations' => $conversations,
            'activeConversation' => $conversation,
            'messages' => $messages,
            'workspace' => $workspace->value,
        ]);
    }
}
