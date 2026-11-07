<?php

declare(strict_types=1);

namespace App\Http\Controllers\Report;

use App\Actions\Report\CreateReport;
use App\Http\Requests\Report\CreateReportRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

final class ReportController
{
    public function store(CreateReportRequest $request, CreateReport $action): RedirectResponse|JsonResponse
    {
        $report = $action->handle(
            $request->user(),
            $request->validated('target_type'),
            $request->validated('target_id'),
            $request->validated('reason'),
            $request->validated('details'),
            $request->file('evidence') ?? []
        );

        if ($request->wantsJson()) {
            return response()->json([
                'report' => $report->load('evidences'),
                'message' => 'Report received. Our team reviews within 24 hours.',
            ], 201);
        }

        return back()->with('success', 'Report received. Our team reviews within 24 hours.');
    }
}
