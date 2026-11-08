<?php

declare(strict_types=1);

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Enums\ShopStatus;
use App\Models\ModerationQueueItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * @return array<string, mixed>
 */
function validApplicationPayload(array $overrides = []): array
{
    return array_merge([
        'shop_name' => 'Sitti\'s Halal Kitchen',
        'description' => 'Fresh halal meals and pantry staples.',
        'location' => 'Zamboanga City',
        'contact_number' => '+639171234567',
        'halal_only' => '1',
        'id_type' => 'philsys',
        'id_number' => 'PSN-1234567',
        'id_document' => UploadedFile::fake()->image('id.jpg'),
        'selfie' => UploadedFile::fake()->image('selfie.jpg'),
        'bank_account_name' => 'Sitti Hassan',
        'bank_account_number' => '1234-5678-90',
        'bank_name' => 'BDO',
        'agreed_to_terms' => '1',
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

    $response = $this->actingAs($buyer)
        ->post(route('seller.register.store'), validApplicationPayload());

    $response->assertRedirect(route('seller.register'));

    $shop = $buyer->shop()->first();
    expect($shop)->not->toBeNull()
        ->and($shop->status)->toBe(ShopStatus::Pending)
        ->and($shop->name)->toBe('Sitti\'s Halal Kitchen')
        ->and($shop->halal_only)->toBeTrue()
        ->and($shop->agreed_to_terms)->toBeTrue()
        ->and($shop->submitted_at)->not->toBeNull()
        ->and($shop->id_document_url)->toStartWith('/storage/shop-documents/')
        ->and($shop->selfie_url)->toStartWith('/storage/shop-documents/')
        ->and($buyer->isSeller())->toBeFalse();

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
    $shop = Shop::factory()->pending()->create(['user_id' => User::factory()]);

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
        );
});

test('admin can approve a shop application making the applicant a seller', function () {
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
            'action' => 'approved',
            'reason' => 'Documents verified.',
        ])
        ->assertRedirect(route('admin.moderation.index'));

    $shop->refresh();
    expect($shop->status)->toBe(ShopStatus::Approved)
        ->and($shop->reviewed_at)->not->toBeNull()
        ->and($shop->reviewed_by)->toBe($admin->id)
        ->and($applicant->refresh()->isSeller())->toBeTrue();
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
});

test('rejected applicant can resubmit their application in place', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $shop = Shop::factory()->rejected()->create([
        'user_id' => $user->id,
        'rejection_reason' => 'Blurry ID photo.',
    ]);

    $this->actingAs($user)
        ->get(route('seller.register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('application.status', 'rejected')
            ->where('application.rejection_reason', 'Blurry ID photo.')
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

    $this->assertDatabaseHas('moderation_queue_items', [
        'target_id' => $shop->id,
        'type' => ModerationItemType::ShopApplication->value,
        'state' => ModerationState::Pending->value,
    ]);
});

test('isSeller reflects role and shop status', function () {
    $roleSeller = User::factory()->create(['role' => 'seller']);
    expect($roleSeller->isSeller())->toBeTrue();

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
