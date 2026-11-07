<?php

declare(strict_types=1);

namespace App\Http\Controllers\Notification;

use App\Actions\Notification\MarkNotificationRead;
use App\Http\Requests\Notification\CreateNotificationReadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

final class NotificationReadController
{
    public function store(CreateNotificationReadRequest $request, MarkNotificationRead $action): RedirectResponse|JsonResponse
    {
        $action->handle($request->user(), $request->validated('id'));

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
            ]);
        }

        return back();
    }
}
