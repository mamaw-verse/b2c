<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Actions\Chat\MarkConversationRead;
use App\Http\Requests\Chat\CreateConversationReadRequest;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

final class ConversationReadController
{
    public function store(CreateConversationReadRequest $request, Conversation $conversation, MarkConversationRead $action): RedirectResponse|JsonResponse
    {
        $count = $action->handle($request->user(), $conversation);

        if ($request->wantsJson()) {
            return response()->json([
                'updated_count' => $count,
            ]);
        }

        return back();
    }
}
