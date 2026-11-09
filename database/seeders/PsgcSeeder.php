<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

final class PsgcSeeder extends Seeder
{
    private const DATA_DIR = __DIR__.'/../data/';

    public function run(): void
    {
        DB::statement('SET session_replication_role = replica;');

        DB::table('barangays')->truncate();
        DB::table('cities')->truncate();
        DB::table('provinces')->truncate();
        DB::table('regions')->truncate();

        DB::statement('SET session_replication_role = DEFAULT;');

        $now = now()->toDateTimeString();

        // ── Regions ────────────────────────────────────────────────────────────
        /** @var array<array{psgcCode:string,regCode:string,regionName:string}> $rawRegions */
        $rawRegions = json_decode(
            File::get(self::DATA_DIR.'psgc-regions.json'),
            true,
        );

        // Map regCode → psgcCode for province linkage
        $regionCodeMap = [];
        $regionRows = [];

        foreach ($rawRegions as $r) {
            $regionCodeMap[$r['regCode']] = $r['psgcCode'];
            $regionRows[] = [
                'code' => $r['psgcCode'],
                'name' => $r['regionName'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('regions')->insert($regionRows);
        $this->command->info('Regions: '.count($regionRows));

        // ── Provinces ──────────────────────────────────────────────────────────
        /** @var array<array{psgcCode:string,regCode:string,provCode:string,provName:string}> $rawProvinces */
        $rawProvinces = json_decode(
            File::get(self::DATA_DIR.'psgc-provinces.json'),
            true,
        );

        // Map regCode+provCode → psgcCode for muncity linkage
        $provinceCodeMap = [];
        $provinceRows = [];

        foreach ($rawProvinces as $p) {
            $regionPsgcCode = $regionCodeMap[$p['regCode']] ?? null;

            if ($regionPsgcCode === null) {
                continue;
            }

            $key = $p['regCode'].'_'.$p['provCode'];
            $provinceCodeMap[$key] = $p['psgcCode'];

            $provinceRows[] = [
                'code' => $p['psgcCode'],
                'name' => $p['provName'],
                'region_code' => $regionPsgcCode,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($provinceRows, 200) as $chunk) {
            DB::table('provinces')->insert($chunk);
        }

        $this->command->info('Provinces: '.count($provinceRows));

        // ── Cities / Municipalities ────────────────────────────────────────────
        /** @var array<string,string> $postalCodeMap psgcCode → postal_code */
        $postalCodeMap = json_decode(
            File::get(self::DATA_DIR.'psgc-postalcodes.json'),
            true,
        ) ?: [];

        /** @var array<array{psgcCode:string,regCode:string,provCode:string,munCityCode:string,munCityName:string}> $rawMunCities */
        $rawMunCities = json_decode(
            File::get(self::DATA_DIR.'psgc-muncities.json'),
            true,
        );

        // Map regCode+munCityCode → psgcCode for barangay linkage
        $cityCodeMap = [];
        $cityRows = [];

        foreach ($rawMunCities as $mc) {
            $key = $mc['regCode'].'_'.$mc['provCode'];
            $provincePsgcCode = $provinceCodeMap[$key] ?? null;

            if ($provincePsgcCode === null) {
                continue;
            }

            $cityKey = $mc['regCode'].'_'.$mc['munCityCode'];
            $cityCodeMap[$cityKey] = $mc['psgcCode'];

            $cityRows[] = [
                'code' => $mc['psgcCode'],
                'name' => $mc['munCityName'],
                'province_code' => $provincePsgcCode,
                'is_municipality' => false,
                'postal_code' => $postalCodeMap[$mc['psgcCode']] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($cityRows, 500) as $chunk) {
            DB::table('cities')->insert($chunk);
        }

        $this->command->info('Cities/Municipalities: '.count($cityRows));

        // ── Barangays ──────────────────────────────────────────────────────────
        /** @var array<array{psgcCode:string,regCode:string,munCityCode:string,brgyCode:string,brgyName:string}> $rawBarangays */
        $rawBarangays = json_decode(
            File::get(self::DATA_DIR.'psgc-barangays.json'),
            true,
        );

        $barangayRows = [];

        foreach ($rawBarangays as $b) {
            $cityKey = $b['regCode'].'_'.$b['munCityCode'];
            $cityPsgcCode = $cityCodeMap[$cityKey] ?? null;

            if ($cityPsgcCode === null) {
                continue;
            }

            $barangayRows[] = [
                'code' => $b['psgcCode'],
                'name' => mb_trim($b['brgyName']),
                'city_code' => $cityPsgcCode,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($barangayRows, 1000) as $chunk) {
            DB::table('barangays')->insert($chunk);
        }

        $this->command->info('Barangays: '.count($barangayRows));
    }
}
