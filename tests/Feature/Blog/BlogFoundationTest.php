<?php

declare(strict_types=1);

use App\Enums\BlogPostStatus;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogEditorInvitation;
use App\Models\BlogImage;
use App\Models\BlogPost;
use Database\Seeders\BlogBaselineSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

const BLOG_TABLES = [
    'blog_categories', 'blog_images', 'blog_authors', 'blog_posts', 'blog_tags',
    'blog_post_tag', 'blog_post_products', 'blog_post_images',
    'blog_post_slug_histories', 'blog_editor_invitations',
];

test('the blog is disabled by default', function () {
    expect(config('blog.enabled'))->toBeFalse();
});

test('every blog table exists', function () {
    foreach (BLOG_TABLES as $table) {
        expect(Schema::hasTable($table))->toBeTrue("missing table {$table}");
    }
});

test('the blog migration rolls back and re-applies', function () {
    $path = 'database/migrations/2026_11_25_000000_create_blog_tables.php';

    Artisan::call('migrate:rollback', ['--path' => $path, '--force' => true]);

    foreach (BLOG_TABLES as $table) {
        expect(Schema::hasTable($table))->toBeFalse("table {$table} survived rollback");
    }

    Artisan::call('migrate', ['--path' => $path, '--force' => true]);

    foreach (BLOG_TABLES as $table) {
        expect(Schema::hasTable($table))->toBeTrue("table {$table} not re-created");
    }
});

test('post factory states map to live, scheduled, draft and archived', function () {
    $draft = BlogPost::factory()->draft()->create();
    $published = BlogPost::factory()->published()->create();
    $scheduled = BlogPost::factory()->scheduled()->create();
    $archived = BlogPost::factory()->archived()->create();

    expect($draft->status)->toBe(BlogPostStatus::Draft)
        ->and($published->isLive())->toBeTrue()
        ->and($published->coverImage)->toBeInstanceOf(BlogImage::class)
        ->and($scheduled->status)->toBe(BlogPostStatus::Published)
        ->and($scheduled->isLive())->toBeFalse()
        ->and($scheduled->isScheduled())->toBeTrue()
        ->and($archived->isLive())->toBeFalse();

    expect(BlogPost::query()->live()->pluck('id')->all())->toBe([$published->id]);
});

test('scheduled posts become live once their publish time arrives', function () {
    $scheduled = BlogPost::factory()->scheduled()->create();

    expect(BlogPost::query()->live()->count())->toBe(0);

    $this->travelTo(now()->addDays(2));

    expect(BlogPost::query()->live()->pluck('id')->all())->toBe([$scheduled->id]);
});

test('soft deleted posts are excluded from queries', function () {
    $post = BlogPost::factory()->published()->create();
    $post->delete();

    expect(BlogPost::query()->live()->count())->toBe(0)
        ->and(BlogPost::withTrashed()->count())->toBe(1);
});

test('post scopes filter by category, author, featured and search', function () {
    $category = BlogCategory::factory()->create();
    $author = BlogAuthor::factory()->create();
    $match = BlogPost::factory()->published()->featured()->create([
        'blog_category_id' => $category->id,
        'blog_author_id' => $author->id,
        'title' => 'Halal Pantry Staples',
    ]);
    BlogPost::factory()->published()->create(['title' => 'Something Else']);

    expect(BlogPost::query()->inCategory($category)->pluck('id')->all())->toBe([$match->id])
        ->and(BlogPost::query()->byAuthor($author)->pluck('id')->all())->toBe([$match->id])
        ->and(BlogPost::query()->featured()->pluck('id')->all())->toBe([$match->id])
        ->and(BlogPost::query()->search('pantry')->pluck('id')->all())->toBe([$match->id])
        ->and(BlogPost::query()->search('100%')->count())->toBe(0)
        ->and(BlogPost::query()->search('   ')->count())->toBe(2);
});

test('author and creator are separate relations on a post', function () {
    $creator = App\Models\User::factory()->create();
    $post = BlogPost::factory()->create(['created_by_id' => $creator->id]);

    expect($post->creator->is($creator))->toBeTrue()
        ->and($post->author)->toBeInstanceOf(BlogAuthor::class)
        ->and($post->author->user_id)->toBeNull();
});

test('an author may be credited only when active and consented, or the house author', function () {
    expect(BlogAuthor::factory()->make()->canBeCredited())->toBeTrue()
        ->and(BlogAuthor::factory()->withoutConsent()->make()->canBeCredited())->toBeFalse()
        ->and(BlogAuthor::factory()->inactive()->make()->canBeCredited())->toBeFalse()
        ->and(BlogAuthor::factory()->house()->make()->canBeCredited())->toBeTrue()
        ->and(BlogAuthor::factory()->house()->inactive()->make()->canBeCredited())->toBeFalse();
});

test('only one pending editor invitation is allowed per email, case-insensitively', function () {
    $attrs = ['expires_at' => now()->addWeek()];

    BlogEditorInvitation::query()->create(['email' => 'Writer@Example.com'] + $attrs);

    // Nested transaction = savepoint, so the expected failure does not abort the test transaction on PostgreSQL.
    expect(fn () => DB::transaction(
        fn () => BlogEditorInvitation::query()->create(['email' => 'writer@example.com'] + $attrs)
    ))->toThrow(QueryException::class);

    BlogEditorInvitation::query()->where('email', 'Writer@Example.com')->update(['revoked_at' => now()]);

    $again = BlogEditorInvitation::query()->create(['email' => 'writer@example.com'] + $attrs);

    expect($again->isPending())->toBeTrue();
});

test('the baseline seeder creates launch categories and one house author', function () {
    $this->seed(BlogBaselineSeeder::class);

    expect(BlogCategory::query()->orderBy('sort_order')->pluck('slug')->all())->toBe([
        'shopping-guides', 'halal-food-and-pantry', 'recipes', 'ramadan-and-eid', 'lifestyle', 'seller-stories',
    ]);

    $system = BlogCategory::query()->where('is_system', true)->pluck('slug')->all();
    expect($system)->toBe(['seller-stories'])
        ->and(BlogCategory::query()->whereNotNull('description')->count())->toBe(0);

    $house = BlogAuthor::query()->where('is_house', true)->get();
    expect($house)->toHaveCount(1)
        ->and($house->first()->display_name)->toBe('HalalBenta Editorial')
        ->and($house->first()->slug)->toBe('halalbenta-editorial')
        ->and($house->first()->canBeCredited())->toBeTrue();
});

test('the baseline seeder is idempotent and keeps admin edits', function () {
    $this->seed(BlogBaselineSeeder::class);

    BlogCategory::query()->where('slug', 'recipes')->update(['name' => 'Kitchen', 'description' => 'Real copy']);
    BlogAuthor::query()->where('is_house', true)->update(['display_name' => 'Renamed Desk']);

    $this->seed(BlogBaselineSeeder::class);

    expect(BlogCategory::query()->count())->toBe(6)
        ->and(BlogCategory::query()->where('slug', 'recipes')->value('name'))->toBe('Kitchen')
        ->and(BlogCategory::query()->where('slug', 'recipes')->value('description'))->toBe('Real copy')
        ->and(BlogAuthor::query()->count())->toBe(1)
        ->and(BlogAuthor::query()->where('is_house', true)->value('display_name'))->toBe('Renamed Desk');
});

test('a category cannot be deleted while it has posts', function () {
    $post = BlogPost::factory()->create();

    expect(fn () => DB::transaction(fn () => $post->category->delete()))->toThrow(QueryException::class);
})->skip(fn () => ! in_array(config('database.default'), ['sqlite', 'pgsql'], true));

test('the blog middleware 404s every guarded route while the flag is off', function () {
    $this->withoutVite();

    Route::middleware(['web', 'blog'])->get('/__blog-probe', fn () => 'ok')->name('__blog-probe');

    config(['blog.enabled' => false]);
    $this->get('/__blog-probe')->assertNotFound();

    config(['blog.enabled' => true]);
    $this->get('/__blog-probe')->assertOk()->assertSee('ok');
});
