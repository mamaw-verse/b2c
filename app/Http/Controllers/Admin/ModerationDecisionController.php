<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Moderation\ApproveModerationItem;
use App\Actions\Moderation\HideModerationItem;
use App\Actions\Moderation\RejectModerationItem;
use App\Actions\Moderation\SuspendModerationTarget;
use App\Http\Requests\Admin\CreateModerationDecisionRequest;
use App\Models\ModerationQueueItem;
use Illuminate\Http\RedirectResponse;

final class ModerationDecisionController
{
    public function store(
        CreateModerationDecisionRequest $request,
        ModerationQueueItem $moderationQueueItem,
        ApproveModerationItem $approve,
        RejectModerationItem $reject,
        HideModerationItem $hide,
        SuspendModerationTarget $suspend,
    ): RedirectResponse {
        $admin = $request->user();
        $reason = $request->decisionReason();

        $ip = $request->ip();

        match ($request->action()) {
            'approved' => $approve->handle($moderationQueueItem, $admin, $reason, $ip),
            'rejected' => $reject->handle($moderationQueueItem, $admin, $reason, $ip),
            'hidden' => $hide->handle($moderationQueueItem, $admin, $reason, $ip),
            'suspended' => $suspend->handle($moderationQueueItem, $admin, $reason, $ip),
        };

        return redirect()->route('admin.moderation.index');
    }
}
