<?php

declare(strict_types=1);

namespace App\Http\Controllers\Notification;

use App\Actions\Notification\MarkNotificationRead;
use App\Enums\Workspace;
use App\Http\Requests\Notification\CreateNotificationReadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

final class NotificationReadController
{
    public function store(CreateNotificationReadRequest $request, MarkNotificationRead $action): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $workspace = Workspace::tryFrom((string) $request->validated('workspace')) ?? Workspace::Buyer;

        $action->handle($user, $request->validated('id'), $workspace, $user->operatedShop());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
            ]);
        }

        return back();
    }
}
