<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Moderation\ApproveModerationItem;
use App\Actions\Moderation\HideModerationItem;
use App\Actions\Moderation\RejectModerationItem;
use App\Actions\Moderation\RequestModerationChanges;
use App\Actions\Moderation\SuspendModerationTarget;
use App\Actions\Moderation\WarnModerationTarget;
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
        RequestModerationChanges $requestChanges,
        WarnModerationTarget $warn,
    ): RedirectResponse {
        $admin = $request->user();
        $reason = $request->decisionReason();

        $ip = $request->ip();

        match ($request->action()) {
            'approved' => $approve->handle($moderationQueueItem, $admin, $reason, $ip),
            'rejected' => $reject->handle($moderationQueueItem, $admin, $reason, $ip),
            'hidden' => $hide->handle($moderationQueueItem, $admin, $reason, $ip),
            'suspended' => $suspend->handle($moderationQueueItem, $admin, $reason, $ip),
            'changes_requested' => $requestChanges->handle($moderationQueueItem, $admin, 'changes_requested', $reason, $ip),
            'certificate_requested' => $requestChanges->handle($moderationQueueItem, $admin, 'certificate_requested', $reason, $ip),
            'warn' => $warn->handle($moderationQueueItem, $admin, $reason, $ip),
        };

        // Warnings keep the item in the queue, so stay on the detail page.
        return $request->action() === 'warn'
            ? redirect()->route('admin.moderation.show', $moderationQueueItem)
            : redirect()->route('admin.moderation.index');
    }
}
