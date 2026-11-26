<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

// ---- B4.4: bulk reassign posts ----

test('an admin moves all of an author\'s posts, trashed ones included, without touching updated_at', function () {
    $admin = acAdmin();
    $from = BlogAuthor::factory()->inactive()->create(['display_name' => 'Gone Writer']);
    $to = BlogAuthor::factory()->create(['display_name' => 'New Writer']);
    $untouched = BlogAuthor::factory()->create();

    $live = BlogPost::factory()->published()->create(['blog_author_id' => $from->id]);
    $draft = BlogPost::factory()->draft()->create(['blog_author_id' => $from->id]);
    $trashed = BlogPost::factory()->published()->create(['blog_author_id' => $from->id]);
    $trashed->delete();
    $elsewhere = BlogPost::factory()->published()->create(['blog_author_id' => $untouched->id]);

    $updatedAt = $live->fresh()->updated_at->toIso8601String();
    $this->travelTo(now()->addHours(3));

    $this->actingAs($admin)
        ->post(route('admin.blog.authors.reassignment.store', $from), ['to_author_id' => $to->id])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($live->fresh()->blog_author_id)->toBe($to->id)
        ->and($draft->fresh()->blog_author_id)->toBe($to->id)
        ->and(BlogPost::withTrashed()->find($trashed->id)->blog_author_id)->toBe($to->id)
        ->and($elsewhere->fresh()->blog_author_id)->toBe($untouched->id)
        ->and($live->fresh()->updated_at->toIso8601String())->toBe($updatedAt);

    $audit = AuditLog::query()->where('action', 'blog.author.posts_reassigned')->sole();

    expect($audit->metadata['count'])->toBe(3)
        ->and($audit->metadata['from_author_id'])->toBe($from->id)
        ->and($audit->metadata['to_author_id'])->toBe($to->id)
        ->and($audit->metadata['post_ids'])->toHaveCount(3);
});

test('reassigning clears the public blog cache so the new byline shows', function () {
    $admin = acAdmin();
    $from = BlogAuthor::factory()->create();
    $to = BlogAuthor::factory()->create();
    BlogPost::factory()->published()->create(['blog_author_id' => $from->id]);

    config(['blog.enabled' => true]);
    Cache::put('blog:index:popular', ['stale'], 300);
    Cache::put('blog:feed', 'stale', 300);

    $this->actingAs($admin)->post(route('admin.blog.authors.reassignment.store', $from), ['to_author_id' => $to->id])->assertRedirect();

    expect(Cache::has('blog:index:popular'))->toBeFalse()
        ->and(Cache::has('blog:feed'))->toBeFalse();
});

test('the target must be a different, active, consented author', function () {
    $admin = acAdmin();
    $from = BlogAuthor::factory()->create();
    BlogPost::factory()->published()->create(['blog_author_id' => $from->id]);

    $inactive = BlogAuthor::factory()->inactive()->create();
    $noConsent = BlogAuthor::factory()->create(['consent_confirmed_at' => null]);

    $post = fn (string $to) => $this->actingAs($admin)->post(route('admin.blog.authors.reassignment.store', $from), ['to_author_id' => $to]);

    $post($from->id)->assertSessionHasErrors('to_author_id');
    $post($inactive->id)->assertSessionHasErrors('to_author_id');
    $post($noConsent->id)->assertSessionHasErrors('to_author_id');
    $post('does-not-exist')->assertSessionHasErrors('to_author_id');
    $this->actingAs($admin)->post(route('admin.blog.authors.reassignment.store', $from))->assertSessionHasErrors('to_author_id');

    expect(BlogPost::query()->where('blog_author_id', $from->id)->count())->toBe(1)
        ->and(AuditLog::query()->where('action', 'blog.author.posts_reassigned')->count())->toBe(0);
});

test('the house author can receive posts', function () {
    $admin = acAdmin();
    $from = BlogAuthor::factory()->create();
    $house = BlogAuthor::factory()->house()->create();
    $post = BlogPost::factory()->published()->create(['blog_author_id' => $from->id]);

    $this->actingAs($admin)->post(route('admin.blog.authors.reassignment.store', $from), ['to_author_id' => $house->id])->assertRedirect();

    expect($post->fresh()->blog_author_id)->toBe($house->id);
});

test('an author with no posts reports it and writes no audit row', function () {
    $admin = acAdmin();
    $from = BlogAuthor::factory()->create();
    $to = BlogAuthor::factory()->create();

    $this->actingAs($admin)->post(route('admin.blog.authors.reassignment.store', $from), ['to_author_id' => $to->id])
        ->assertRedirect()
        ->assertSessionHas('success', "{$from->display_name} has no posts to reassign.");

    expect(AuditLog::query()->where('action', 'blog.author.posts_reassigned')->count())->toBe(0);
});

test('editors cannot reassign posts', function () {
    $from = BlogAuthor::factory()->create();
    $to = BlogAuthor::factory()->create();
    $post = BlogPost::factory()->published()->create(['blog_author_id' => $from->id]);

    $this->actingAs(acEditor())->post(route('admin.blog.authors.reassignment.store', $from), ['to_author_id' => $to->id])->assertNotFound();

    expect($post->fresh()->blog_author_id)->toBe($from->id);
});
