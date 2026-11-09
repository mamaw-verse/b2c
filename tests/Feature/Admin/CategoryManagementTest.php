<?php

declare(strict_types=1);

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function adminUser(): User
{
    return User::factory()->create(['role' => 'admin']);
}

test('admin can list categories', function () {
    $admin = adminUser();
    Category::factory()->create(['name' => 'Halal Food', 'commission_bps' => 500]);

    $response = $this->actingAs($admin)->get(route('admin.categories.index'));

    $response->assertOk();
    $categories = $response->viewData('page')['props']['categories'];
    expect(collect($categories)->pluck('name'))->toContain('Halal Food');
});

test('admin can create a category with percent commission converted to basis points', function () {
    $admin = adminUser();
    $parent = Category::factory()->create();

    $response = $this->actingAs($admin)->post(route('admin.categories.store'), [
        'name' => 'Frozen Meals',
        'parent_id' => $parent->id,
        'icon' => 'snowflake',
        'commission_rate' => 7.5,
        'requires_certification' => true,
    ]);

    $response->assertRedirect(route('admin.categories.index'));

    $category = Category::where('name', 'Frozen Meals')->first();
    expect($category)->not->toBeNull()
        ->and($category->slug)->toBe('frozen-meals')
        ->and($category->parent_id)->toBe($parent->id)
        ->and($category->commission_bps)->toBe(750);

    $this->assertDatabaseHas('audit_logs', ['action' => 'category.created', 'actor_id' => $admin->id]);
});

test('category slug must be unique', function () {
    $admin = adminUser();
    Category::factory()->create(['slug' => 'halal-food']);

    $this->actingAs($admin)->post(route('admin.categories.store'), [
        'name' => 'Anything',
        'slug' => 'halal-food',
        'icon' => 'package',
        'requires_certification' => true,
    ])->assertSessionHasErrors('slug');
});

test('admin can update a category but not parent it to itself or a descendant', function () {
    $admin = adminUser();
    $parent = Category::factory()->create();
    $child = Category::factory()->create(['parent_id' => $parent->id]);

    $this->actingAs($admin)->put(route('admin.categories.update', $parent), [
        'name' => $parent->name,
        'parent_id' => $child->id,
        'icon' => $parent->icon,
        'requires_certification' => true,
    ])->assertSessionHasErrors('parent_id');

    $this->actingAs($admin)->put(route('admin.categories.update', $child), [
        'name' => 'Renamed Child',
        'parent_id' => '',
        'icon' => 'tag',
        'sort_order' => 3,
        'requires_certification' => false,
    ])->assertRedirect();

    expect($child->fresh()->name)->toBe('Renamed Child')
        ->and($child->fresh()->parent_id)->toBeNull()
        ->and($child->fresh()->requires_certification)->toBeFalse();
});

test('category deletion is blocked while products or subcategories exist', function () {
    $admin = adminUser();
    $withProduct = Category::factory()->create();
    Product::factory()->create(['category_id' => $withProduct->id]);
    $withChild = Category::factory()->create();
    Category::factory()->create(['parent_id' => $withChild->id]);
    $empty = Category::factory()->create();

    $this->actingAs($admin)->delete(route('admin.categories.destroy', $withProduct))->assertSessionHasErrors('category');
    $this->actingAs($admin)->delete(route('admin.categories.destroy', $withChild))->assertSessionHasErrors('category');
    $this->actingAs($admin)->delete(route('admin.categories.destroy', $empty))->assertRedirect();

    expect(Category::find($empty->id))->toBeNull();
    $this->assertDatabaseHas('audit_logs', ['action' => 'category.deleted']);
});

test('non-admin gets a not found response on category routes', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();

    $this->actingAs($user)->get(route('admin.categories.index'))->assertNotFound();
    $this->actingAs($user)->post(route('admin.categories.store'), [])->assertNotFound();
    $this->actingAs($user)->put(route('admin.categories.update', $category), [])->assertNotFound();
    $this->actingAs($user)->delete(route('admin.categories.destroy', $category))->assertNotFound();
});
