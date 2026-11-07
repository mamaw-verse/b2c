<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Barangay;
use App\Models\City;
use Illuminate\Http\JsonResponse;

final class PsgcBarangayController
{
    public function __invoke(City $city): JsonResponse
    {
        $barangays = Barangay::where('city_code', $city->code)
            ->orderBy('name')
            ->get(['code', 'name', 'city_code']);

        return response()->json($barangays);
    }
}
