<?php

declare(strict_types=1);

use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Enums\ShopStatus;
use App\Models\Barangay;
use App\Models\City;
use App\Models\ModerationQueueItem;
use App\Models\Province;
use App\Models\Region;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array<string, mixed>
 */
function validApplicationPayload(array $overrides = []): array
{
    $region = Region::factory()->create();
    $province = Province::factory()->create([
        'name' => 'Zamboanga del Sur',
        'region_code' => $region->code,
    ]);
    $city = City::factory()->create([
        'name' => 'Zamboanga City',
        'province_code' => $province->code,
    ]);
    $barangay = Barangay::factory()->create([
        'city_code' => $city->code,
    ]);

    return array_merge([
        'logo' => UploadedFile::fake()->image('logo.png'),
        'shop_name' => 'Sitti\'s Halal Kitchen',
        'description' => 'Fresh halal meals and pantry staples.',
        'address_line' => '123 Gov. Lim Avenue',
        'city' => 'Zamboanga City',
        'state' => 'Zamboanga del Sur',
        'postal_code' => '7000',
        'region_code' => $region->code,
        'province_code' => $province->code,
        'city_code' => $city->code,
        'barangay_code' => $barangay->code,
        'business_permit' => UploadedFile::fake()->create('permit.pdf', 100, 'application/pdf'),
        'certificates' => [
            [
                'certifying_body' => 'Islamic Da’wah Council of the Philippines (IDCP)',
                'certificate_number' => 'HC-2026-00001',
                'valid_until' => now()->addYear()->toDateString(),
                'document' => UploadedFile::fake()->create('halal-cert.pdf', 100, 'application/pdf'),
            ],
        ],
        'agreed_to_terms' => '1',
        'halal_only' => '1',
    ], $overrides);
}

test('guests are redirected to login when accessing seller registration', function () {
    $this->get(route('seller.register'))->assertRedirect(route('login'));
    $this->post(route('seller.register.store'))->assertRedirect(route('login'));
});

test('verified buyer can view the seller registration form', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($buyer)
        ->get(route('seller.register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/register')
            ->where('application', null)
        );
});

test('user with an approved shop gets a not found response', function () {
    $user = User::factory()->create();
    Shop::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('seller.register'))
        ->assertNotFound();
});

test('buyer can submit a shop application which enters the moderation queue', function () {
    Storage::fake('public');

    $buyer = User::factory()->create(['role' => 'buyer']);
    $payload = validApplicationPayload();

    $response = $this->actingAs($buyer)
        ->post(route('seller.register.store'), $payload);

    $response->assertRedirect(route('seller.register'));

    $shop = $buyer->shop()->first();
    expect($shop)->not->toBeNull()
        ->and($shop->status)->toBe(ShopStatus::Pending)
        ->and($shop->name)->toBe('Sitti\'s Halal Kitchen')
        ->and($shop->agreed_to_terms)->toBeTrue()
        ->and($shop->terms_version)->toBe(config('marketplace.seller_terms.version'))
        ->and($shop->terms_accepted_at)->not->toBeNull()
        ->and($shop->halal_only)->toBeTrue()
        ->and($shop->submitted_at)->not->toBeNull()
        ->and($shop->logo_url)->toStartWith('/storage/shop-documents/')
        ->and($shop->business_permit_url)->toStartWith('/storage/shop-documents/')
        ->and($shop->address_line)->toBe('123 Gov. Lim Avenue')
        ->and($shop->city)->toBe('Zamboanga City')
        ->and($shop->state)->toBe('Zamboanga del Sur')
        ->and($shop->postal_code)->toBe('7000')
        ->and($shop->region_code)->toBe($payload['region_code'])
        ->and($shop->province_code)->toBe($payload['province_code'])
        ->and($shop->city_code)->toBe($payload['city_code'])
        ->and($shop->barangay_code)->toBe($payload['barangay_code'])
        ->and($shop->location)->toBe('Zamboanga City')
        ->and($buyer->isSeller())->toBeFalse();

    $certificate = $shop->halalCertifications()->sole();
    expect($certificate->certifying_body)->toContain('IDCP')
        ->and($certificate->number)->toBe('HC-2026-00001')
        ->and($certificate->document_path)->toStartWith('shop-documents/certificates/');

    $this->assertDatabaseHas('moderation_queue_items', [
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
        'flagged_by_id' => $buyer->id,
    ]);
});

test('shop name must be unique across applications', function () {
    Storage::fake('public');

    Shop::factory()->create(['name' => 'Sitti\'s Halal Kitchen']);
    $buyer = User::factory()->create();

    $this->actingAs($buyer)
        ->post(route('seller.register.store'), validApplicationPayload())
        ->assertSessionHasErrors('shop_name');
});

test('buyer with a pending application sees its status and cannot resubmit', function () {
    $user = User::factory()->create();
    Shop::factory()->pending()->create([
        'user_id' => $user->id,
        'name' => 'Pending Pantry',
    ]);

    $this->actingAs($user)
        ->get(route('seller.register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/register')
            ->where('application.status', 'pending')
            ->where('application.shop_name', 'Pending Pantry')
        );

    $this->actingAs($user)
        ->post(route('seller.register.store'), validApplicationPayload())
        ->assertNotFound();
});

test('admin sees a shop application in the moderation queue with a preview', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shop = Shop::factory()->pending()->create([
        'user_id' => User::factory(),
        'halal_only' => true,
        'terms_version' => '2026.1',
        'terms_accepted_at' => now(),
    ]);
    $shop->halalCertifications()->create([
        'certifying_body' => 'IDCP',
        'number' => 'HC-2026-00001',
        'valid_until' => now()->addYear()->toDateString(),
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.moderation.index', ['type' => 'shop_application']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/moderation/index')
            ->has('queue.data', 1)
            ->where('counts.shop_application', 1)
        );

    $this->actingAs($admin)
        ->get(route('admin.moderation.show', $item))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/moderation/show')
            ->where('preview.kind', 'shop_application')
            ->where('preview.snapshot.shop_name', $shop->name)
            ->where('preview.snapshot.halal_only', true)
            ->where('preview.snapshot.terms_version', '2026.1')
            ->where('preview.snapshot.terms_accepted_at', $shop->terms_accepted_at?->toISOString())
            ->where('preview.snapshot.submitted_at', $shop->submitted_at?->toISOString())
            ->has('preview.snapshot.certificates', 1)
            ->where('preview.snapshot.certificates.0.certifying_body', 'IDCP')
        );
});

test('admin can approve a shop application making the applicant a seller', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $applicant = User::factory()->create();
    $shop = Shop::factory()->pending()->create(['user_id' => $applicant->id]);
    $certificate = $shop->halalCertifications()->create([
        'certifying_body' => 'IDCP',
        'number' => 'HC-2026-00001',
        'valid_until' => now()->addYear()->toDateString(),
    ]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'approved',
            'reason' => 'Documents verified.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::Approved)
        ->and($shop->reviewed_at)->not->toBeNull()
        ->and($shop->reviewed_by)->toBe($admin->id)
        ->and($certificate->refresh()->checked_at)->not->toBeNull()
        ->and($applicant->refresh()->isSeller())->toBeTrue();

    $this->actingAs($applicant)->get(route('seller.dashboard'))->assertOk();
    $this->get(route('seller.register'))->assertNotFound();
});

test('admin can reject a shop application with a reason', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $applicant = User::factory()->create();
    $shop = Shop::factory()->pending()->create(['user_id' => $applicant->id]);

    $item = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.moderation.decisions.store', $item), [
            'action' => 'rejected',
            'reason' => 'ID document is unreadable.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::Rejected)
        ->and($shop->rejection_reason)->toBe('ID document is unreadable.')
        ->and($applicant->refresh()->isSeller())->toBeFalse();

    $this->actingAs($applicant)->get(route('seller.dashboard'))->assertRedirect(route('seller.register'));
    $this->get(route('seller.register'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('application.status', 'rejected')
            ->where('application.rejection_reason', 'ID document is unreadable.'));
});

test('rejected applicant can resubmit their application in place', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $shop = Shop::factory()->rejected()->create([
        'user_id' => $user->id,
        'rejection_reason' => 'Missing business permit.',
    ]);
    $shop->halalCertifications()->create([
        'certifying_body' => 'Old Body',
        'number' => 'OLD-1',
        'valid_until' => now()->addMonths(6)->toDateString(),
    ]);

    $this->actingAs($user)
        ->get(route('seller.register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('application.status', 'rejected')
            ->where('application.rejection_reason', 'Missing business permit.')
            ->has('application.certificates', 1)
        );

    $this->actingAs($user)
        ->post(route('seller.register.store'), validApplicationPayload())
        ->assertRedirect(route('seller.register'));

    expect(Shop::where('user_id', $user->id)->count())->toBe(1);

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::Pending)
        ->and($shop->name)->toBe('Sitti\'s Halal Kitchen')
        ->and($shop->rejection_reason)->toBeNull()
        ->and($shop->reviewed_at)->toBeNull();

    // Certificates are replaced with the newly submitted ones.
    $certificate = $shop->halalCertifications()->sole();
    expect($certificate->number)->toBe('HC-2026-00001');

    $this->assertDatabaseHas('moderation_queue_items', [
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);
});

test('applicant with requested changes can resubmit their application in place', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $shop = Shop::factory()->changesRequested()->create([
        'user_id' => $user->id,
        'rejection_reason' => 'Certificate number is unreadable.',
    ]);

    $existingItem = ModerationQueueItem::factory()->create([
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Flagged->value,
        'reason_code' => 'changes_requested',
        'decision_reason' => 'Certificate number is unreadable.',
    ]);

    $this->actingAs($user)
        ->get(route('seller.register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('application.status', 'changes_requested')
            ->where('application.rejection_reason', 'Certificate number is unreadable.')
        );

    $this->actingAs($user)
        ->post(route('seller.register.store'), validApplicationPayload())
        ->assertRedirect(route('seller.register'));

    expect(Shop::where('user_id', $user->id)->count())->toBe(1);

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::Pending)
        ->and($shop->rejection_reason)->toBeNull()
        ->and($shop->reviewed_at)->toBeNull()
        ->and($shop->reviewed_by)->toBeNull();

    expect(ModerationQueueItem::where('target_id', $shop->id)->count())->toBe(1);

    $existingItem->refresh();
    expect($existingItem->state)->toBe(ModerationState::Pending)
        ->and($existingItem->reason_code)->toBeNull()
        ->and($existingItem->decision_reason)->toBeNull();
});

test('applicant can resubmit without uploading saved documents again', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $payload = validApplicationPayload();
    $logoPath = 'shop-documents/saved-logo.png';
    $permitPath = 'shop-documents/saved-permit.pdf';
    $certificatePath = 'shop-documents/certificates/saved-certificate.pdf';
    Storage::disk('public')->put($logoPath, 'logo');
    Storage::disk('public')->put($permitPath, 'permit');
    Storage::disk('public')->put($certificatePath, 'certificate');
    $validUntil = now()->addYear()->toDateString();

    $shop = Shop::factory()->rejected()->create([
        'user_id' => $user->id,
        'logo_url' => Storage::disk('public')->url($logoPath),
        'business_permit_url' => Storage::disk('public')->url($permitPath),
        'region_code' => $payload['region_code'],
        'province_code' => $payload['province_code'],
        'city_code' => $payload['city_code'],
        'barangay_code' => $payload['barangay_code'],
        'halal_only' => true,
    ]);
    $certificate = $shop->halalCertifications()->create([
        'certifying_body' => 'Saved Authority',
        'number' => 'SAVED-1',
        'valid_until' => $validUntil,
        'document_path' => $certificatePath,
    ]);

    $this->actingAs($user)
        ->get(route('seller.register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('application.logo_url', Storage::disk('public')->url($logoPath))
            ->where('application.business_permit_url', Storage::disk('public')->url($permitPath))
            ->where('application.halal_only', true)
            ->where('application.region_code', $payload['region_code'])
            ->where('application.province_code', $payload['province_code'])
            ->where('application.city_code', $payload['city_code'])
            ->where('application.barangay_code', $payload['barangay_code'])
            ->where('application.certificates.0.id', $certificate->id)
            ->where('application.certificates.0.document_url', Storage::disk('public')->url($certificatePath))
        );

    $payload['logo'] = null;
    $payload['business_permit'] = null;
    $payload['certificates'] = [[
        'id' => $certificate->id,
        'certifying_body' => 'Saved Authority',
        'certificate_number' => 'SAVED-1',
        'valid_until' => $validUntil,
        'document' => null,
    ]];

    $this->actingAs($user)
        ->post(route('seller.register.store'), $payload)
        ->assertRedirect(route('seller.register'));

    expect($shop->refresh()->logo_url)->toBe(Storage::disk('public')->url($logoPath))
        ->and($shop->business_permit_url)->toBe(Storage::disk('public')->url($permitPath))
        ->and($shop->halal_only)->toBeTrue()
        ->and($shop->region_code)->toBe($payload['region_code'])
        ->and($shop->halalCertifications()->sole()->id)->toBe($certificate->id)
        ->and($shop->halalCertifications()->sole()->document_path)->toBe($certificatePath);

    Storage::disk('public')->assertExists($logoPath);
    Storage::disk('public')->assertExists($permitPath);
    Storage::disk('public')->assertExists($certificatePath);
});

test('applicant can replace certificates and remove omitted certificates on resubmission', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $payload = validApplicationPayload();
    $shop = Shop::factory()->changesRequested()->create([
        'user_id' => $user->id,
        'region_code' => $payload['region_code'],
        'province_code' => $payload['province_code'],
        'city_code' => $payload['city_code'],
        'barangay_code' => $payload['barangay_code'],
        'business_permit_url' => '/storage/shop-documents/saved-permit.pdf',
    ]);
    $keptCertificate = $shop->halalCertifications()->create([
        'certifying_body' => 'Old Authority',
        'number' => 'OLD-1',
        'valid_until' => now()->addYear()->toDateString(),
        'document_path' => 'shop-documents/certificates/old-kept.pdf',
    ]);
    $removedCertificate = $shop->halalCertifications()->create([
        'certifying_body' => 'Removed Authority',
        'number' => 'OLD-2',
        'valid_until' => now()->addYear()->toDateString(),
        'document_path' => 'shop-documents/certificates/old-removed.pdf',
    ]);

    $payload['logo'] = null;
    $payload['business_permit'] = null;
    $payload['certificates'] = [
        [
            'id' => $keptCertificate->id,
            'certifying_body' => 'Updated Authority',
            'certificate_number' => 'UPDATED-1',
            'valid_until' => now()->addYears(2)->toDateString(),
            'document' => UploadedFile::fake()->create('replacement.pdf', 100, 'application/pdf'),
        ],
        [
            'certifying_body' => 'New Authority',
            'certificate_number' => 'NEW-1',
            'valid_until' => now()->addYears(2)->toDateString(),
            'document' => UploadedFile::fake()->create('new-certificate.pdf', 100, 'application/pdf'),
        ],
    ];

    $this->actingAs($user)
        ->post(route('seller.register.store'), $payload)
        ->assertRedirect(route('seller.register'));

    expect($shop->halalCertifications()->count())->toBe(2)
        ->and($keptCertificate->refresh()->number)->toBe('UPDATED-1')
        ->and($keptCertificate->document_path)->not->toBe('shop-documents/certificates/old-kept.pdf')
        ->and($shop->halalCertifications()->where('number', 'NEW-1')->exists())->toBeTrue();

    $this->assertModelMissing($removedCertificate);
    Storage::disk('public')->assertExists($keptCertificate->document_path);
    Storage::disk('public')->assertExists($shop->halalCertifications()->where('number', 'NEW-1')->value('document_path'));
});

test('applicant cannot submit another shop certificate id', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $payload = validApplicationPayload();
    $shop = Shop::factory()->changesRequested()->create([
        'user_id' => $user->id,
        'business_permit_url' => '/storage/shop-documents/saved-permit.pdf',
    ]);
    $ownCertificate = $shop->halalCertifications()->create([
        'certifying_body' => 'Own Authority',
        'number' => 'OWN-1',
        'valid_until' => now()->addYear()->toDateString(),
    ]);
    $otherShop = Shop::factory()->create();
    $otherCertificate = $otherShop->halalCertifications()->create([
        'certifying_body' => 'Other Authority',
        'number' => 'OTHER-1',
        'valid_until' => now()->addYear()->toDateString(),
    ]);

    $payload['logo'] = null;
    $payload['business_permit'] = null;
    $payload['certificates'] = [[
        'id' => $otherCertificate->id,
        'certifying_body' => 'Other Authority',
        'certificate_number' => 'OTHER-1',
        'valid_until' => now()->addYear()->toDateString(),
        'document' => null,
    ]];

    $this->actingAs($user)
        ->post(route('seller.register.store'), $payload)
        ->assertSessionHasErrors('certificates.0.id');

    expect($ownCertificate->refresh()->number)->toBe('OWN-1')
        ->and($otherCertificate->refresh()->number)->toBe('OTHER-1');
});

test('submission fails without agreeing to the seller terms', function () {
    Storage::fake('public');

    $buyer = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($buyer)
        ->post(route('seller.register.store'), validApplicationPayload(['agreed_to_terms' => null]))
        ->assertSessionHasErrors('agreed_to_terms');
});

test('application requires at least one certificate', function () {
    Storage::fake('public');

    $buyer = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($buyer)
        ->post(route('seller.register.store'), validApplicationPayload(['certificates' => []]))
        ->assertSessionHasErrors('certificates');
});

test('a certificate expiring in the past is rejected', function () {
    Storage::fake('public');

    $buyer = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($buyer)
        ->post(route('seller.register.store'), validApplicationPayload([
            'certificates' => [
                [
                    'certifying_body' => 'IDCP',
                    'certificate_number' => 'HC-2024-00001',
                    'valid_until' => now()->subDay()->toDateString(),
                    'document' => UploadedFile::fake()->create('cert.pdf', 100, 'application/pdf'),
                ],
            ],
        ]))
        ->assertSessionHasErrors('certificates.0.valid_until');
});

test('shop logo is optional', function () {
    Storage::fake('public');

    $buyer = User::factory()->create(['role' => 'buyer']);

    $this->actingAs($buyer)
        ->post(route('seller.register.store'), validApplicationPayload(['logo' => null]))
        ->assertRedirect(route('seller.register'));

    expect($buyer->shop()->sole()->logo_url)->toBeNull();
});

test('expired shop certificate is flagged by the scheduled moderation check', function () {
    $seller = User::factory()->create();
    $shop = Shop::factory()->create(['user_id' => $seller->id]);
    $shop->halalCertifications()->create([
        'certifying_body' => 'IDCP',
        'number' => 'HC-2024-00009',
        'valid_until' => now()->subDays(2)->toDateString(),
    ]);

    Artisan::call('moderation:flag-expiring-certificates');

    $this->assertDatabaseHas('moderation_queue_items', [
        'target_type' => $shop->getMorphClass(),
        'target_id' => $shop->id,
        'type' => ModerationItemType::Expiry->value,
        'reason_code' => ModerationReason::HalalCertificateExpired->value,
    ]);
});

test('isSeller reflects shop status only', function () {
    $buyer = User::factory()->create(['role' => 'buyer']);
    expect($buyer->isSeller())->toBeFalse();

    $approved = User::factory()->create();
    Shop::factory()->create(['user_id' => $approved->id]);
    expect($approved->isSeller())->toBeTrue();

    $pending = User::factory()->create();
    Shop::factory()->pending()->create(['user_id' => $pending->id]);
    expect($pending->isSeller())->toBeFalse();

    $rejected = User::factory()->create();
    Shop::factory()->rejected()->create(['user_id' => $rejected->id]);
    expect($rejected->isSeller())->toBeFalse();
});
