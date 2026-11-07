<?php

declare(strict_types=1);

use App\Enums\ReportStatus;
use App\Models\Product;
use App\Models\Report;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('guest cannot submit a report', function () {
    $this->post(route('reports.store'), [
        'target_type' => 'product',
        'target_id' => '123',
        'reason' => 'Prohibited item',
    ])->assertRedirect(route('login'));
});

test('user can report a product with reason and details', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();

    $response = $this->actingAs($user)->postJson(route('reports.store'), [
        'target_type' => 'product',
        'target_id' => $product->id,
        'reason' => 'Halal claim conflicts with ingredients',
        'details' => 'The ingredients label lists gelatin from pork.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('report.reason', 'Halal claim conflicts with ingredients')
        ->assertJsonPath('report.status', ReportStatus::Pending->value);

    $this->assertDatabaseHas('reports', [
        'reporter_id' => $user->id,
        'reportable_type' => Product::class,
        'reportable_id' => $product->id,
        'reason' => 'Halal claim conflicts with ingredients',
    ]);
});

test('user can report with evidence images', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $shop = Shop::factory()->create();

    $file1 = UploadedFile::fake()->image('evidence1.jpg');
    $file2 = UploadedFile::fake()->image('evidence2.png');

    $response = $this->actingAs($user)->postJson(route('reports.store'), [
        'target_type' => 'shop',
        'target_id' => $shop->id,
        'reason' => 'Scam or asks to pay outside the app',
        'details' => 'Shop requested GCash payment directly.',
        'evidence' => [$file1, $file2],
    ]);

    $response->assertCreated();

    /** @var Report $report */
    $report = Report::where('reporter_id', $user->id)->first();
    expect($report)->not->toBeNull();
    expect($report->evidences)->toHaveCount(2);

    Storage::disk('public')->assertExists($report->evidences[0]->file_path);
    Storage::disk('public')->assertExists($report->evidences[1]->file_path);
});

test('report requires valid reason and target', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson(route('reports.store'), [
        'target_type' => 'invalid_type',
        'target_id' => '123',
        'reason' => '',
    ])->assertJsonValidationErrors(['target_type', 'reason']);
});
