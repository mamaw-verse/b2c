<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\Barangay;
use App\Models\City;
use App\Models\Province;

test('formattedAddress skips empty segments instead of double commas', function () {
    $address = new Address([
        'street' => '123 E2E Street',
        'postal_code' => '1000',
    ]);
    $address->setRelation('barangay', null);
    $address->setRelation('city', null);
    $address->setRelation('province', null);

    expect($address->formatted_address)->toBe('123 E2E Street, 1000');
});

test('formattedAddress joins all present segments', function () {
    $address = new Address([
        'street' => '1 Rizal Ave',
        'postal_code' => '9600',
    ]);
    $address->setRelation('barangay', new Barangay(['name' => 'Poblacion']));
    $address->setRelation('city', new City(['name' => 'Cotabato City']));
    $address->setRelation('province', new Province(['name' => 'Maguindanao']));

    expect($address->formatted_address)
        ->toBe('1 Rizal Ave, Poblacion, Cotabato City, Maguindanao 9600');
});
