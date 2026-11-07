<?php

declare(strict_types=1);

namespace App\Http\Controllers\Notification;

use App\Actions\Notification\GetNotifications;
use App\Http\Requests\Notification\ListNotificationsRequest;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

final class NotificationController
{
    public function index(ListNotificationsRequest $request, GetNotifications $action): Response|JsonResponse
    {
        $notifications = $action->handle($request->user());

        if ($request->wantsJson()) {
            return response()->json([
                'notifications' => $notifications,
            ]);
        }

        return Inertia::render('notifications', [
            'notifications' => $notifications,
        ]);
    }
}
