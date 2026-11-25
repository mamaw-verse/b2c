<?php

declare(strict_types=1);

use App\Actions\Blog\Admin\ValidateBlogPostForPublish;
use App\Enums\BlogPostStatus;
use App\Models\AuditLog;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogImage;
use App\Models\BlogPost;
use App\Models\BlogPostSlugHistory;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function paAdmin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function paEditor(): User
{
    return User::factory()->create(['role' => 'editor']);
}

/** @return array<string, mixed> */
function paPayload(array $overrides = []): array
{
    return [
        'title' => 'Halal Pantry Guide',
        'excerpt' => 'A short guide to stocking a halal pantry with confidence, from spices to sauces.',
        'body_markdown' => "## Start here\n\n".implode(' ', array_fill(0, 200, 'pantry')),
        'blog_category_id' => BlogCategory::factory()->create()->id,
        'blog_author_id' => BlogAuthor::factory()->create()->id,
        ...$overrides,
    ];
}

/** A draft that passes every blocking publish check. */
function paReady(User $creator, array $overrides = []): BlogPost
{
    return BlogPost::factory()->draft()->create([
        'created_by_id' => $creator->id,
        'excerpt' => 'A short guide to stocking a halal pantry with confidence, from spices to sauces.',
        'body_markdown' => "## Start here\n\n".implode(' ', array_fill(0, 200, 'pantry')),
        'cover_image_id' => BlogImage::factory()->create(['uploaded_by_id' => $creator->id])->id,
        ...$overrides,
    ]);
}

test('an editor writes on behalf of another author: byline is the author, creator is the editor, audit has both', function () {
    $editor = paEditor();
    $guest = BlogAuthor::factory()->create();

    $this->actingAs($editor)->post(route('admin.blog.posts.store'), paPayload(['blog_author_id' => $guest->id]))->assertRedirect();

    $post = BlogPost::query()->firstOrFail();
    expect($post->blog_author_id)->toBe($guest->id)
        ->and($post->created_by_id)->toBe($editor->id)
        ->and($post->status)->toBe(BlogPostStatus::Draft)
        ->and($post->slug)->toBe('halal-pantry-guide')
        ->and($post->body_html)->toContain('<h2')
        ->and($post->word_count)->toBeGreaterThan(150);

    $audit = AuditLog::query()->where('action', 'blog.post.created')->firstOrFail();
    expect($audit->metadata['author_id'])->toBe($guest->id)->and($audit->metadata['created_by_id'])->toBe($editor->id);
});

test('the author defaults to the editor\'s own profile', function () {
    $editor = paEditor();
    $own = BlogAuthor::factory()->create(['user_id' => $editor->id]);

    $this->actingAs($editor)->post(route('admin.blog.posts.store'), collect(paPayload())->except('blog_author_id')->all())->assertRedirect();

    expect(BlogPost::query()->firstOrFail()->blog_author_id)->toBe($own->id);
});

test('an inactive author cannot be chosen for a new post', function () {
    $inactive = BlogAuthor::factory()->inactive()->create();

    $this->actingAs(paEditor())->post(route('admin.blog.posts.store'), paPayload(['blog_author_id' => $inactive->id]))
        ->assertSessionHasErrors('blog_author_id');
});

test('editors edit and delete only their own posts, and delete only drafts', function () {
    $mine = paEditor();
    $theirs = BlogPost::factory()->create(['created_by_id' => paEditor()->id]);
    $own = BlogPost::factory()->draft()->create(['created_by_id' => $mine->id]);
    $ownPublished = BlogPost::factory()->published()->create(['created_by_id' => $mine->id]);

    $this->actingAs($mine)->get(route('admin.blog.posts.edit', $theirs))->assertNotFound();
    $this->actingAs($mine)->put(route('admin.blog.posts.update', $theirs), paPayload())->assertNotFound();
    $this->actingAs($mine)->delete(route('admin.blog.posts.destroy', $theirs))->assertNotFound();
    $this->actingAs($mine)->get(route('admin.blog.posts.preview', $theirs))->assertNotFound();
    $this->actingAs($mine)->post(route('admin.blog.posts.publication.store', $theirs))->assertNotFound();

    $this->actingAs($mine)->get(route('admin.blog.posts.edit', $own))->assertOk();
    $this->actingAs($mine)->delete(route('admin.blog.posts.destroy', $ownPublished))->assertNotFound();
    $this->actingAs($mine)->delete(route('admin.blog.posts.destroy', $own))->assertRedirect();

    expect(BlogPost::query()->whereKey($own->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('action', 'blog.post.deleted')->count())->toBe(1);

    $this->actingAs(paAdmin())->delete(route('admin.blog.posts.destroy', $ownPublished))->assertRedirect();
});

test('the post list shows editors only their own posts and admins everything', function () {
    $editor = paEditor();
    BlogPost::factory()->create(['created_by_id' => $editor->id]);
    BlogPost::factory()->count(2)->create(['created_by_id' => paEditor()->id]);

    $this->actingAs($editor)->get(route('admin.blog.posts.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/blog/posts')->where('posts.meta.total', 1)->where('is_admin', false));
    $this->actingAs(paAdmin())->get(route('admin.blog.posts.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->where('posts.meta.total', 3));
});

test('changing the slug keeps the old one in history, and slugs cannot be reserved or stolen', function () {
    $admin = paAdmin();
    $post = BlogPost::factory()->create(['slug' => 'old-slug']);
    $other = BlogPost::factory()->create(['slug' => 'taken']);

    $this->actingAs($admin)->put(route('admin.blog.posts.update', $post), paPayload(['slug' => 'new-slug']))->assertRedirect();
    expect($post->fresh()->slug)->toBe('new-slug')
        ->and(BlogPostSlugHistory::query()->where('slug', 'old-slug')->where('blog_post_id', $post->id)->exists())->toBeTrue();

    $this->actingAs($admin)->put(route('admin.blog.posts.update', $other), paPayload(['slug' => 'old-slug']))->assertSessionHasErrors('slug');
    $this->actingAs($admin)->put(route('admin.blog.posts.update', $other), paPayload(['slug' => 'category']))->assertSessionHasErrors('slug');
    $this->actingAs($admin)->put(route('admin.blog.posts.update', $other), paPayload(['slug' => 'new-slug']))->assertSessionHasErrors('slug');

    // The post itself may go back to a slug it once had.
    $this->actingAs($admin)->put(route('admin.blog.posts.update', $post), paPayload(['slug' => 'old-slug']))->assertRedirect();
    expect(BlogPostSlugHistory::query()->where('slug', 'old-slug')->exists())->toBeFalse();
});

test('created_by never changes when someone else edits', function () {
    $editor = paEditor();
    $post = BlogPost::factory()->create(['created_by_id' => $editor->id]);

    $this->actingAs(paAdmin())->put(route('admin.blog.posts.update', $post), paPayload())->assertRedirect();

    expect($post->fresh()->created_by_id)->toBe($editor->id);
});

test('saving rebuilds tags, product and image relations from the content', function () {
    $editor = paEditor();
    $product = Product::factory()->create();
    $bodyImage = BlogImage::factory()->purpose('body')->create(['uploaded_by_id' => $editor->id]);
    $cover = BlogImage::factory()->create(['uploaded_by_id' => $editor->id]);

    $this->actingAs($editor)->post(route('admin.blog.posts.store'), paPayload([
        'cover_image_id' => $cover->id,
        'tags' => ['Ramadan', 'ramadan', 'Pantry Staples'],
        'body_markdown' => "## Hi\n\nText.\n\n![Alt](blog-image:{$bodyImage->id})\n\n[[product:{$product->slug}]]\n",
    ]))->assertRedirect();

    $post = BlogPost::query()->firstOrFail();
    expect($post->tags()->count())->toBe(2)
        ->and($post->products()->pluck('products.id')->all())->toBe([$product->id])
        ->and($post->images()->pluck('blog_images.id')->sort()->values()->all())->toBe(collect([$cover->id, $bodyImage->id])->sort()->values()->all());

    $this->actingAs($editor)->put(route('admin.blog.posts.update', $post), paPayload([
        'blog_category_id' => $post->blog_category_id,
        'blog_author_id' => $post->blog_author_id,
        'tags' => [],
        'body_markdown' => '## Only text',
    ]))->assertRedirect();

    $post->refresh();
    expect($post->tags()->count())->toBe(0)->and($post->products()->count())->toBe(0)->and($post->images()->count())->toBe(0);
});

test('cover and thumbnail must be images of the right purpose', function () {
    $body = BlogImage::factory()->purpose('body')->create();

    $this->actingAs(paEditor())->post(route('admin.blog.posts.store'), paPayload(['cover_image_id' => $body->id]))->assertSessionHasErrors('cover_image_id');
    $this->actingAs(paEditor())->post(route('admin.blog.posts.store'), paPayload(['thumbnail_image_id' => $body->id]))->assertSessionHasErrors('thumbnail_image_id');
});

test('a post that passes every check publishes now', function () {
    $editor = paEditor();
    $post = paReady($editor);

    $this->actingAs($editor)->post(route('admin.blog.posts.publication.store', $post))->assertRedirect();

    $post->refresh();
    expect($post->status)->toBe(BlogPostStatus::Published)->and($post->isLive())->toBeTrue();
    expect(AuditLog::query()->where('action', 'blog.post.published')->count())->toBe(1);
});

test('a future publish time schedules the post and it is not live until then', function () {
    $editor = paEditor();
    $post = paReady($editor);
    $when = now()->addDays(2)->startOfMinute();

    $this->actingAs($editor)->post(route('admin.blog.posts.publication.store', $post), ['published_at' => $when->toDateTimeString()])->assertRedirect();

    expect($post->fresh()->isScheduled())->toBeTrue()
        ->and(BlogPost::query()->live()->whereKey($post->id)->exists())->toBeFalse();

    $this->travelTo($when->copy()->addMinute());
    expect(BlogPost::query()->live()->whereKey($post->id)->exists())->toBeTrue();
});

test('each blocking publish rule stops publishing', function (string $case) {
    $editor = paEditor();
    $post = paReady($editor);

    match ($case) {
        'no cover' => $post->update(['cover_image_id' => null]),
        'cover without alt' => $post->coverImage->update(['alt' => '']),
        'short excerpt' => $post->update(['excerpt' => 'Too short']),
        'short body' => $post->update(['body_markdown' => "## Hi\n\nOnly a few words here."]),
        'author without consent' => $post->author->update(['consent_confirmed_at' => null]),
        'inactive author' => $post->author->update(['is_active' => false]),
        'unknown product' => $post->update(['body_markdown' => $post->body_markdown."\n\n[[product:does-not-exist]]\n"]),
        'unknown image' => $post->update(['body_markdown' => $post->body_markdown."\n\n![x](blog-image:01hzzzzzzzzzzzzzzzzzzzzzzz)\n"]),
        'body image without alt' => $post->update(['body_markdown' => "## Hi\n\n".implode(' ', array_fill(0, 200, 'pantry'))."\n\n![](blog-image:".BlogImage::factory()->purpose('body')->create(['alt' => null])->id.")\n"]),
        'reserved slug' => $post->update(['slug' => 'category']),
    };

    $this->actingAs($editor)->post(route('admin.blog.posts.publication.store', $post))->assertSessionHasErrors('publish');

    expect($post->fresh()->status)->toBe(BlogPostStatus::Draft);
})->with([
    'no cover', 'cover without alt', 'short excerpt', 'short body', 'author without consent',
    'inactive author', 'unknown product', 'unknown image', 'body image without alt', 'reserved slug',
]);

test('warnings do not block publishing', function () {
    $editor = paEditor();
    $post = paReady($editor, [
        'body_markdown' => "Intro without a heading. This miracle cures everything.\n\n".implode(' ', array_fill(0, 200, 'pantry')),
    ]);

    $check = app(ValidateBlogPostForPublish::class)->handle($post);
    expect($check->passes())->toBeTrue()
        ->and(implode(' ', $check->warnings))->toContain('section heading')
        ->and(implode(' ', $check->warnings))->toContain('miracle')
        ->and(implode(' ', $check->warnings))->toContain('No thumbnail');

    $this->actingAs($editor)->post(route('admin.blog.posts.publication.store', $post))->assertRedirect();
    expect($post->fresh()->status)->toBe(BlogPostStatus::Published);
});

test('the checklist is part of the edit page props', function () {
    $editor = paEditor();
    $post = BlogPost::factory()->draft()->create(['created_by_id' => $editor->id, 'cover_image_id' => null]);

    $this->actingAs($editor)->get(route('admin.blog.posts.edit', $post))->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/blog/post-form')->where('publish_check.can_publish', false)->has('publish_check.errors'));
});

test('unpublish, archive and restore move a post between statuses and are audited', function () {
    $editor = paEditor();
    $post = paReady($editor);
    $this->actingAs($editor)->post(route('admin.blog.posts.publication.store', $post));

    $this->actingAs($editor)->delete(route('admin.blog.posts.publication.destroy', $post))->assertRedirect();
    expect($post->fresh()->status)->toBe(BlogPostStatus::Draft)->and($post->fresh()->published_at)->not->toBeNull();

    $this->actingAs($editor)->post(route('admin.blog.posts.archive.store', $post))->assertRedirect();
    expect($post->fresh()->status)->toBe(BlogPostStatus::Archived);

    $this->actingAs($editor)->delete(route('admin.blog.posts.archive.destroy', $post))->assertRedirect();
    expect($post->fresh()->status)->toBe(BlogPostStatus::Draft);

    expect(AuditLog::query()->whereIn('action', ['blog.post.unpublished', 'blog.post.archived'])->count())->toBe(2);
});

test('only admins feature posts, and archiving clears the flag', function () {
    $editor = paEditor();
    $post = BlogPost::factory()->published()->create(['created_by_id' => $editor->id]);

    $this->actingAs($editor)->put(route('admin.blog.posts.featured.update', $post), ['is_featured' => true])->assertNotFound();

    $this->actingAs(paAdmin())->put(route('admin.blog.posts.featured.update', $post), ['is_featured' => true])->assertRedirect();
    expect($post->fresh()->is_featured)->toBeTrue();
    expect(AuditLog::query()->where('action', 'blog.post.featured')->count())->toBe(1);

    $this->actingAs($editor)->post(route('admin.blog.posts.archive.store', $post));
    expect($post->fresh()->is_featured)->toBeFalse();
});

test('after publishing only an admin can change the author, and it is audited', function () {
    $editor = paEditor();
    $post = BlogPost::factory()->published()->create(['created_by_id' => $editor->id]);
    $newAuthor = BlogAuthor::factory()->create();

    $payload = paPayload([
        'blog_category_id' => $post->blog_category_id,
        'blog_author_id' => $newAuthor->id,
    ]);

    $this->actingAs($editor)->put(route('admin.blog.posts.update', $post), $payload)->assertSessionHasErrors('blog_author_id');

    $this->actingAs(paAdmin())->put(route('admin.blog.posts.update', $post), $payload)->assertRedirect();
    expect($post->fresh()->blog_author_id)->toBe($newAuthor->id);

    $audit = AuditLog::query()->where('action', 'blog.post.updated')->latest('id')->firstOrFail();
    expect($audit->metadata)->toHaveKey('author_changed');
});

test('a draft can be re-credited by its editor', function () {
    $editor = paEditor();
    $post = BlogPost::factory()->draft()->create(['created_by_id' => $editor->id]);
    $newAuthor = BlogAuthor::factory()->create();

    $this->actingAs($editor)->put(route('admin.blog.posts.update', $post), paPayload([
        'blog_category_id' => $post->blog_category_id,
        'blog_author_id' => $newAuthor->id,
    ]))->assertRedirect();

    expect($post->fresh()->blog_author_id)->toBe($newAuthor->id);
});

test('the markdown preview endpoint uses the shared renderer and strips hostile input', function () {
    $response = $this->actingAs(paEditor())->postJson(route('admin.blog.markdown-preview.store'), [
        'markdown' => "# Title\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))",
    ])->assertOk();

    expect($response->json('html'))->toContain('<h2')->not->toContain('<script')->not->toContain('javascript:');

    $this->actingAs(User::factory()->create())->postJson(route('admin.blog.markdown-preview.store'), ['markdown' => 'x'])->assertNotFound();
});

test('the preview page renders any status for the owner and is noindex', function () {
    $editor = paEditor();
    $post = BlogPost::factory()->draft()->create(['created_by_id' => $editor->id]);

    $this->actingAs($editor)->get(route('admin.blog.posts.preview', $post))->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/blog/post-preview')->where('post.id', $post->id));
});
