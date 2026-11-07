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

        match ($request->action()) {
            'approved' => $approve->handle($moderationQueueItem, $admin, $reason),
            'rejected' => $reject->handle($moderationQueueItem, $admin, $reason),
            'hidden' => $hide->handle($moderationQueueItem, $admin, $reason),
            'suspended' => $suspend->handle($moderationQueueItem, $admin, $reason),
        };

        return redirect()->route('admin.moderation.index');
    }
}
