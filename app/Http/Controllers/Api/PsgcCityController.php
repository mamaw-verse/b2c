<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\City;
use App\Models\Province;
use Illuminate\Http\JsonResponse;

final class PsgcCityController
{
    public function __invoke(Province $province): JsonResponse
    {
        $cities = City::where('province_code', $province->code)
            ->orderBy('name')
            ->get(['code', 'name', 'province_code', 'is_municipality', 'postal_code']);

        return response()->json($cities);
    }
}
