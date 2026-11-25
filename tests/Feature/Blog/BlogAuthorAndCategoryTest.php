<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

function acAdmin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function acEditor(): User
{
    return User::factory()->create(['role' => 'editor']);
}

test('an admin creates a guest author, consent only when ticked, slug generated and not reserved', function () {
    $admin = acAdmin();

    $this->actingAs($admin)->post(route('admin.blog.authors.store'), ['display_name' => 'Aisha Cruz', 'consent' => '1'])->assertRedirect();
    $this->actingAs($admin)->post(route('admin.blog.authors.store'), ['display_name' => 'No Consent'])->assertRedirect();

    $with = BlogAuthor::query()->where('display_name', 'Aisha Cruz')->firstOrFail();
    $without = BlogAuthor::query()->where('display_name', 'No Consent')->firstOrFail();

    expect($with->slug)->toBe('aisha-cruz')
        ->and($with->canBeCredited())->toBeTrue()
        ->and($with->consent_confirmed_by_id)->toBe($admin->id)
        ->and($without->canBeCredited())->toBeFalse()
        ->and(AuditLog::query()->where('action', 'blog.author.created')->count())->toBe(2);

    $this->actingAs($admin)->post(route('admin.blog.authors.store'), ['display_name' => 'Feed', 'slug' => 'feed.xml'])->assertSessionHasErrors('slug');
    $this->actingAs($admin)->post(route('admin.blog.authors.store'), ['display_name' => 'Tag', 'slug' => 'tag'])->assertSessionHasErrors('slug');
});

test('author links must be https and at most four', function () {
    $admin = acAdmin();

    $this->actingAs($admin)->post(route('admin.blog.authors.store'), [
        'display_name' => 'Linky', 'links' => [['label' => 'Site', 'url' => 'http://insecure.example']],
    ])->assertSessionHasErrors('links.0.url');

    $this->actingAs($admin)->post(route('admin.blog.authors.store'), [
        'display_name' => 'Linky',
        'links' => array_fill(0, 5, ['label' => 'Site', 'url' => 'https://example.com']),
    ])->assertSessionHasErrors('links');
});

test('editors and buyers cannot manage authors or categories', function () {
    $this->actingAs(acEditor())->get(route('admin.blog.authors.index'))->assertNotFound();
    $this->actingAs(acEditor())->post(route('admin.blog.authors.store'), ['display_name' => 'X'])->assertNotFound();
    $this->actingAs(acEditor())->get(route('admin.blog.categories.index'))->assertNotFound();
    $this->actingAs(acEditor())->post(route('admin.blog.categories.store'), ['name' => 'X'])->assertNotFound();
    $this->actingAs(User::factory()->create())->get(route('admin.blog.authors.index'))->assertNotFound();
});

test('consent can be recorded later and is never cleared', function () {
    $admin = acAdmin();
    $author = BlogAuthor::factory()->withoutConsent()->create();

    $this->actingAs($admin)->put(route('admin.blog.authors.update', $author), ['display_name' => $author->display_name, 'consent' => '1'])->assertRedirect();
    $stamp = $author->fresh()->consent_confirmed_at;
    expect($stamp)->not->toBeNull();

    $this->actingAs($admin)->put(route('admin.blog.authors.update', $author), ['display_name' => 'Renamed'])->assertRedirect();
    expect($author->fresh()->consent_confirmed_at->equalTo($stamp))->toBeTrue()
        ->and($author->fresh()->slug)->toBe($author->slug);
});

test('the house author cannot be deactivated or linked to a user', function () {
    $admin = acAdmin();
    $house = BlogAuthor::factory()->house()->create();

    $this->actingAs($admin)->post(route('admin.blog.authors.deactivation.store', $house))->assertSessionHasErrors('author');
    expect($house->fresh()->is_active)->toBeTrue();

    $this->actingAs($admin)->put(route('admin.blog.authors.update', $house), ['display_name' => $house->display_name, 'user_id' => $admin->id])->assertRedirect();
    expect($house->fresh()->user_id)->toBeNull();

    expect(Route::has('admin.blog.authors.destroy'))->toBeFalse();
});

test('deactivating hides an author but keeps their posts credited; reactivating restores', function () {
    $admin = acAdmin();
    $author = BlogAuthor::factory()->create();
    $post = BlogPost::factory()->create(['blog_author_id' => $author->id]);

    $this->actingAs($admin)->post(route('admin.blog.authors.deactivation.store', $author))->assertRedirect();
    expect($author->fresh()->is_active)->toBeFalse()->and($post->fresh()->blog_author_id)->toBe($author->id);

    $this->actingAs($admin)->delete(route('admin.blog.authors.deactivation.destroy', $author))->assertRedirect();
    expect($author->fresh()->is_active)->toBeTrue();
});

test('an editor edits only their own profile fields', function () {
    $editor = acEditor();
    $own = BlogAuthor::factory()->create(['user_id' => $editor->id, 'display_name' => 'Keep Me', 'slug' => 'keep-me']);
    $other = BlogAuthor::factory()->create(['display_name' => 'Other']);

    $this->actingAs($editor)->put(route('admin.blog.profile.update'), [
        'display_name' => 'Hacked', 'slug' => 'hacked', 'bio' => 'New bio', 'job_title' => 'Cook',
        'links' => [['label' => 'Site', 'url' => 'https://example.com']],
    ])->assertRedirect();

    $own->refresh();
    expect($own->bio)->toBe('New bio')->and($own->job_title)->toBe('Cook')
        ->and($own->display_name)->toBe('Keep Me')->and($own->slug)->toBe('keep-me')
        ->and($other->fresh()->display_name)->toBe('Other');
});

test('an admin without a profile creates one on demand with self-consent; nothing is auto-created', function () {
    $admin = acAdmin();
    expect(BlogAuthor::query()->where('user_id', $admin->id)->exists())->toBeFalse();

    $this->actingAs($admin)->post(route('admin.blog.profile.store'), [])->assertSessionHasErrors('consent');
    expect(BlogAuthor::query()->where('user_id', $admin->id)->exists())->toBeFalse();

    $this->actingAs($admin)->post(route('admin.blog.profile.store'), ['consent' => '1'])->assertRedirect();
    $author = BlogAuthor::query()->where('user_id', $admin->id)->firstOrFail();
    expect($author->canBeCredited())->toBeTrue()->and($author->consent_confirmed_by_id)->toBe($admin->id);

    $this->actingAs($admin)->post(route('admin.blog.profile.store'), ['consent' => '1'])->assertNotFound();
});

test('admin blog categories: CRUD, reserved slugs, system and non-empty categories are protected', function () {
    $admin = acAdmin();

    $this->actingAs($admin)->post(route('admin.blog.categories.store'), ['name' => 'Eid Recipes'])->assertRedirect();
    $category = BlogCategory::query()->where('slug', 'eid-recipes')->firstOrFail();
    expect($category->is_system)->toBeFalse();

    $this->actingAs($admin)->post(route('admin.blog.categories.store'), ['name' => 'Tag', 'slug' => 'tag'])->assertSessionHasErrors('slug');

    $this->actingAs($admin)->put(route('admin.blog.categories.update', $category), ['name' => 'Eid Cooking', 'description' => 'Real copy.'])->assertRedirect();
    expect($category->fresh()->name)->toBe('Eid Cooking')->and($category->fresh()->slug)->toBe('eid-recipes');

    $system = BlogCategory::factory()->create(['is_system' => true]);
    $this->actingAs($admin)->delete(route('admin.blog.categories.destroy', $system))->assertSessionHasErrors('category');

    BlogPost::factory()->create(['blog_category_id' => $category->id]);
    $this->actingAs($admin)->delete(route('admin.blog.categories.destroy', $category))->assertSessionHasErrors('category');

    $empty = BlogCategory::factory()->create();
    $this->actingAs($admin)->delete(route('admin.blog.categories.destroy', $empty))->assertRedirect();
    expect(BlogCategory::query()->whereKey($empty->id)->exists())->toBeFalse()
        ->and(AuditLog::query()->whereIn('action', ['blog.category.created', 'blog.category.updated', 'blog.category.deleted'])->count())->toBe(3);
});
