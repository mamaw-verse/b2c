<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Moderation\GetModerationQueueCounts;
use App\Actions\Moderation\ListModerationQueue;
use App\Actions\Moderation\ShowModerationItem;
use App\Http\Requests\Admin\ListModerationQueueRequest;
use App\Http\Requests\Admin\ShowModerationItemRequest;
use App\Models\ModerationQueueItem;
use Inertia\Inertia;
use Inertia\Response;

final class ModerationQueueController
{
    public function index(ListModerationQueueRequest $request, ListModerationQueue $action, GetModerationQueueCounts $counts): Response
    {
        $queue = $action->handle($request->filters());

        return Inertia::render('admin/moderation/index', [
            'queue' => $queue,
            'counts' => $counts->handle(),
            'filters' => $request->filters(),
        ]);
    }

    public function show(ShowModerationItemRequest $request, ModerationQueueItem $moderationQueueItem, ShowModerationItem $action): Response
    {
        $data = $action->handle($moderationQueueItem);

        return Inertia::render('admin/moderation/show', [
            'item' => $data['item'],
            'preview' => $data['preview'],
        ]);
    }
}
