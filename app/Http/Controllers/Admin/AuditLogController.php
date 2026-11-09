<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\ListAuditLogs;
use App\Http\Requests\Admin\ListAuditLogsRequest;
use Inertia\Inertia;
use Inertia\Response;

final class AuditLogController
{
    public function index(ListAuditLogsRequest $request, ListAuditLogs $action): Response
    {
        return Inertia::render('admin/audit-log', $action->handle(
            $request->string('action')->toString() ?: null,
            $request->string('subject_type')->toString() ?: null,
        ));
    }
}
