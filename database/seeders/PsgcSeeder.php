<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\City;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Database\Seeder;

final class PsgcSeeder extends Seeder
{
    public function run(): void
    {
        // NCR — National Capital Region
        $ncr = Region::create(['code' => '130000000', 'name' => 'NCR (National Capital Region)']);
        $metro = Province::create(['code' => '133900000', 'name' => 'Metro Manila', 'region_code' => $ncr->code]);

        $cities = [
            ['code' => '133901000', 'name' => 'Caloocan', 'is_municipality' => false],
            ['code' => '133902000', 'name' => 'Las Piñas', 'is_municipality' => false],
            ['code' => '133903000', 'name' => 'Makati', 'is_municipality' => false],
            ['code' => '133904000', 'name' => 'Malabon', 'is_municipality' => false],
            ['code' => '133905000', 'name' => 'Mandaluyong', 'is_municipality' => false],
            ['code' => '133906000', 'name' => 'Manila', 'is_municipality' => false],
            ['code' => '133907000', 'name' => 'Marikina', 'is_municipality' => false],
            ['code' => '133908000', 'name' => 'Muntinlupa', 'is_municipality' => false],
            ['code' => '133909000', 'name' => 'Navotas', 'is_municipality' => false],
            ['code' => '133910000', 'name' => 'Parañaque', 'is_municipality' => false],
            ['code' => '133911000', 'name' => 'Pasay', 'is_municipality' => false],
            ['code' => '133912000', 'name' => 'Pasig', 'is_municipality' => false],
            ['code' => '133913000', 'name' => 'Pateros', 'is_municipality' => true],
            ['code' => '133914000', 'name' => 'Quezon City', 'is_municipality' => false],
            ['code' => '133915000', 'name' => 'San Juan', 'is_municipality' => false],
            ['code' => '133916000', 'name' => 'Taguig', 'is_municipality' => false],
            ['code' => '133917000', 'name' => 'Valenzuela', 'is_municipality' => false],
        ];

        foreach ($cities as $cityData) {
            City::create(['province_code' => $metro->code, ...$cityData]);
        }

        // Sample barangays for Manila
        $manila = City::find('133906000');
        $manilaBarangays = [
            ['code' => '133906001', 'name' => 'Barangay 1'],
            ['code' => '133906002', 'name' => 'Barangay 2'],
            ['code' => '133906003', 'name' => 'Ermita'],
            ['code' => '133906004', 'name' => 'Malate'],
            ['code' => '133906005', 'name' => 'Paco'],
            ['code' => '133906006', 'name' => 'Pandacan'],
            ['code' => '133906007', 'name' => 'Sampaloc'],
            ['code' => '133906008', 'name' => 'Santa Ana'],
            ['code' => '133906009', 'name' => 'Santa Cruz'],
            ['code' => '133906010', 'name' => 'Tondo'],
        ];
        foreach ($manilaBarangays as $brgy) {
            Barangay::create(['city_code' => $manila->code, ...$brgy]);
        }

        // Sample barangays for Quezon City
        $qc = City::find('133914000');
        $qcBarangays = [
            ['code' => '133914001', 'name' => 'Bagumbayan'],
            ['code' => '133914002', 'name' => 'Commonwealth'],
            ['code' => '133914003', 'name' => 'Diliman'],
            ['code' => '133914004', 'name' => 'Fairview'],
            ['code' => '133914005', 'name' => 'Holy Spirit'],
            ['code' => '133914006', 'name' => 'Kamias'],
            ['code' => '133914007', 'name' => 'Loyola Heights'],
            ['code' => '133914008', 'name' => 'Novaliches'],
            ['code' => '133914009', 'name' => 'Old Balara'],
            ['code' => '133914010', 'name' => 'Teachers Village East'],
        ];
        foreach ($qcBarangays as $brgy) {
            Barangay::create(['city_code' => $qc->code, ...$brgy]);
        }

        // Sample barangays for Taguig
        $taguig = City::find('133916000');
        $taguigBarangays = [
            ['code' => '133916001', 'name' => 'Bagumbayan'],
            ['code' => '133916002', 'name' => 'Bambang'],
            ['code' => '133916003', 'name' => 'Central Bicutan'],
            ['code' => '133916004', 'name' => 'Central Signal Village'],
            ['code' => '133916005', 'name' => 'Fort Bonifacio'],
            ['code' => '133916006', 'name' => 'Hagonoy'],
            ['code' => '133916007', 'name' => 'Ibayo-Tipas'],
            ['code' => '133916008', 'name' => 'Ligid-Tipas'],
            ['code' => '133916009', 'name' => 'Lower Bicutan'],
            ['code' => '133916010', 'name' => 'Maharlika Village'],
        ];
        foreach ($taguigBarangays as $brgy) {
            Barangay::create(['city_code' => $taguig->code, ...$brgy]);
        }

        // Region III — Central Luzon
        $r3 = Region::create(['code' => '030000000', 'name' => 'Region III (Central Luzon)']);
        $bulacan = Province::create(['code' => '031400000', 'name' => 'Bulacan', 'region_code' => $r3->code]);
        $malolos = City::create(['code' => '031401000', 'name' => 'Malolos', 'province_code' => $bulacan->code, 'is_municipality' => false]);
        Barangay::create(['code' => '031401001', 'name' => 'Anilao', 'city_code' => $malolos->code]);
        Barangay::create(['code' => '031401002', 'name' => 'Babatnin', 'city_code' => $malolos->code]);

        // Region IV-A — CALABARZON
        $r4a = Region::create(['code' => '040000000', 'name' => 'Region IV-A (CALABARZON)']);
        $laguna = Province::create(['code' => '042100000', 'name' => 'Laguna', 'region_code' => $r4a->code]);
        $sanPablo = City::create(['code' => '042101000', 'name' => 'San Pablo', 'province_code' => $laguna->code, 'is_municipality' => false]);
        Barangay::create(['code' => '042101001', 'name' => 'Del Remedio', 'city_code' => $sanPablo->code]);
        Barangay::create(['code' => '042101002', 'name' => 'San Antonio 1', 'city_code' => $sanPablo->code]);
    }
}
