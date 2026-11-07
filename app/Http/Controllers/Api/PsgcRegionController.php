<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Region;
use Illuminate\Http\JsonResponse;

final class PsgcRegionController
{
    public function __invoke(): JsonResponse
    {
        $regions = Region::orderBy('name')->get(['code', 'name']);

        return response()->json($regions);
    }
}
