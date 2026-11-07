<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Moderation\BulkResolveModerationItems;
use App\Http\Requests\Admin\CreateBulkModerationDecisionRequest;
use Illuminate\Http\RedirectResponse;

final class BulkModerationDecisionController
{
    public function store(CreateBulkModerationDecisionRequest $request, BulkResolveModerationItems $action): RedirectResponse
    {
        $action->handle(
            $request->ids(),
            $request->action(),
            $request->user(),
            $request->decisionReason(),
        );

        return redirect()->route('admin.moderation.index');
    }
}
