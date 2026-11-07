<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Http\Requests\Admin\ShowAdminDashboardRequest;
use App\Models\ModerationQueueItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController
{
    public function __invoke(ShowAdminDashboardRequest $request): Response
    {
        $counts = ModerationQueueItem::query()
            ->select('state', 'type', DB::raw('count(*) as total'))
            ->groupBy('state', 'type')
            ->get()
            ->groupBy(fn ($item) => $item->state instanceof ModerationState ? $item->state->value : (string) $item->state)
            ->map(fn ($rows) => $rows->mapWithKeys(fn ($item) => [
                ($item->type instanceof ModerationItemType ? $item->type->value : (string) $item->type) => (int) $item->total,
            ]));

        $expiringCount = ModerationQueueItem::query()
            ->where('type', ModerationItemType::Expiry->value)
            ->whereIn('state', [ModerationState::Pending->value, ModerationState::Flagged->value])
            ->count();

        return Inertia::render('admin/dashboard', [
            'counts' => $counts,
            'expiringCertificatesCount' => $expiringCount,
        ]);
    }
}
