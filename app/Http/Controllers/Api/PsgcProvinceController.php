<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Province;
use App\Models\Region;
use Illuminate\Http\JsonResponse;

final class PsgcProvinceController
{
    public function __invoke(Region $region): JsonResponse
    {
        $provinces = Province::where('region_code', $region->code)
            ->orderBy('name')
            ->get(['code', 'name', 'region_code']);

        return response()->json($provinces);
    }
}
