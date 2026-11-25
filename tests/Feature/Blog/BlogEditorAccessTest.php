<?php

declare(strict_types=1);

use App\Enums\Workspace;
use App\Models\BlogImage;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function blogEditor(): User
{
    return User::factory()->create(['role' => 'editor']);
}

function blogAdmin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function blogEditorUpload(int $width = 900, int $height = 600): UploadedFile
{
    $image = imagecreatetruecolor($width, $height);
    imagefill($image, 0, 0, (int) imagecolorallocate($image, 20, 90, 50));
    ob_start();
    imagejpeg($image);

    return UploadedFile::fake()->createWithContent('photo.jpg', (string) ob_get_clean());
}

test('role helpers distinguish admins, editors and everyone else', function () {
    expect(blogEditor()->isEditor())->toBeTrue()
        ->and(blogEditor()->isAdmin())->toBeFalse()
        ->and(blogEditor()->canManageBlog())->toBeTrue()
        ->and(blogAdmin()->canManageBlog())->toBeTrue()
        ->and(blogAdmin()->isEditor())->toBeFalse()
        ->and(User::factory()->create()->canManageBlog())->toBeFalse();
});

test('editors edit only posts they created, admins edit any', function () {
    $mine = blogEditor();
    $other = blogEditor();
    $post = BlogPost::factory()->create(['created_by_id' => $mine->id]);

    expect($mine->canEditBlogPost($post))->toBeTrue()
        ->and($other->canEditBlogPost($post))->toBeFalse()
        ->and(blogAdmin()->canEditBlogPost($post))->toBeTrue()
        ->and(User::factory()->create()->canEditBlogPost($post))->toBeFalse();
});

test('editors delete only their own drafts, admins delete any post', function () {
    $mine = blogEditor();
    $draft = BlogPost::factory()->draft()->create(['created_by_id' => $mine->id]);
    $published = BlogPost::factory()->published()->create(['created_by_id' => $mine->id]);
    $theirs = BlogPost::factory()->draft()->create(['created_by_id' => blogEditor()->id]);

    expect($mine->canDeleteBlogPost($draft))->toBeTrue()
        ->and($mine->canDeleteBlogPost($published))->toBeFalse()
        ->and($mine->canDeleteBlogPost($theirs))->toBeFalse()
        ->and(blogAdmin()->canDeleteBlogPost($published))->toBeTrue();
});

test('editors keep their buyer workspace and gain the admin workspace; admins stay admin-only', function () {
    $editor = blogEditor();

    expect(Workspace::allowedFor($editor))->toBe([Workspace::Buyer, Workspace::Admin])
        ->and(Workspace::Admin->accessibleBy($editor))->toBeTrue()
        ->and(Workspace::Buyer->accessibleBy($editor))->toBeTrue()
        ->and(Workspace::Seller->accessibleBy($editor))->toBeFalse()
        ->and(Workspace::Admin->home($editor))->toBe('/admin/blog/posts')
        ->and(Workspace::Admin->home(blogAdmin()))->toBe('/admin/dashboard')
        ->and(Workspace::allowedFor(blogAdmin()))->toBe([Workspace::Admin])
        ->and(Workspace::Admin->accessibleBy(User::factory()->create()))->toBeFalse();
});

/** The only admin routes an editor may reach (plan §4.4 / §6.5). Anything new is admin-only until listed here. */
function editorVisibleAdminRoutes(): array
{
    return [
        'admin.blog.images.index', 'admin.blog.images.store', 'admin.blog.images.destroy',
        'admin.blog.markdown-preview.store',
        'admin.blog.posts.index', 'admin.blog.posts.create', 'admin.blog.posts.store',
        'admin.blog.posts.edit', 'admin.blog.posts.update', 'admin.blog.posts.destroy',
        'admin.blog.posts.preview',
        'admin.blog.posts.publication.store', 'admin.blog.posts.publication.destroy',
        'admin.blog.posts.archive.store', 'admin.blog.posts.archive.destroy',
        'admin.blog.profile.edit', 'admin.blog.profile.store', 'admin.blog.profile.update',
    ];
}

test('every admin route is admin-only unless it is on the explicit editor allow-list', function () {
    $adminRoutes = collect(Route::getRoutes()->getRoutes())
        ->filter(fn ($route) => str_starts_with((string) $route->getName(), 'admin.'));

    expect($adminRoutes)->not->toBeEmpty();

    $allowList = editorVisibleAdminRoutes();
    $seen = [];

    foreach ($adminRoutes as $route) {
        $middleware = $route->gatherMiddleware();
        $name = (string) $route->getName();

        expect(in_array('workspace:admin', $middleware, true))->toBeTrue("{$name} lost workspace:admin");

        if (in_array($name, $allowList, true)) {
            $seen[] = $name;
            expect(in_array('blog.manage', $middleware, true))->toBeTrue("{$name} must use blog.manage");
            expect(in_array('admin.only', $middleware, true))->toBeFalse("{$name} would lock editors out");
        } else {
            expect(in_array('admin.only', $middleware, true))->toBeTrue("{$name} is reachable by editors");
        }
    }

    // A typo in the allow-list must not silently pass.
    expect(array_values(array_diff($allowList, $seen)))->toBe([]);
});

test('an editor gets 404 on admin screens outside the blog', function (string $routeName) {
    $this->actingAs(blogEditor())->get(route($routeName))->assertNotFound();
})->with([
    'admin.dashboard',
    'admin.users.index',
    'admin.categories.index',
    'admin.vouchers.index',
    'admin.payouts.index',
    'admin.audit-log.index',
    'admin.moderation.index',
    'admin.settings.edit',
]);

test('an editor cannot change admin settings or categories', function () {
    $this->actingAs(blogEditor())->put(route('admin.settings.update'), [])->assertNotFound();
    $this->actingAs(blogEditor())->post(route('admin.categories.store'), ['name' => 'X'])->assertNotFound();
});

test('buyers get 404 on the blog admin routes', function () {
    $this->actingAs(User::factory()->create())->getJson(route('admin.blog.images.index'))->assertNotFound();
});

test('guests are sent to login on the blog admin routes', function () {
    $this->get(route('admin.blog.images.index'))->assertRedirect(route('login'));
    $this->getJson(route('admin.blog.images.index'))->assertUnauthorized();
});

test('an editor can upload an image and gets the markdown to insert', function () {
    Storage::fake('public');
    $editor = blogEditor();

    $response = $this->actingAs($editor)->postJson(route('admin.blog.images.store'), [
        'image' => blogEditorUpload(),
        'purpose' => 'body',
        'alt' => 'Dates on a plate',
        'caption' => 'Ajwa dates',
    ])->assertCreated();

    $id = $response->json('data.id');

    expect($response->json('data.markdown'))->toBe("![Dates on a plate](blog-image:{$id})");
    expect(BlogImage::query()->findOrFail($id)->uploaded_by_id)->toBe($editor->id);
});

test('an upload that is not an image is a 422 on the image field', function () {
    Storage::fake('public');

    $this->actingAs(blogEditor())->postJson(route('admin.blog.images.store'), [
        'image' => UploadedFile::fake()->createWithContent('photo.jpg', 'not an image'),
        'purpose' => 'body',
        'alt' => 'x',
    ])->assertUnprocessable()->assertJsonValidationErrors('image');
});

test('an unknown purpose and a missing alt on a body image are 422s', function () {
    Storage::fake('public');
    $editor = blogEditor();

    $this->actingAs($editor)->postJson(route('admin.blog.images.store'), ['image' => blogEditorUpload(), 'purpose' => 'banner'])
        ->assertUnprocessable()->assertJsonValidationErrors('purpose');

    $this->actingAs($editor)->postJson(route('admin.blog.images.store'), ['image' => blogEditorUpload(), 'purpose' => 'body'])
        ->assertUnprocessable()->assertJsonValidationErrors('image');
});

test('the library is scoped to the editor, and admins see everything', function () {
    Storage::fake('public');
    $mine = blogEditor();
    $other = blogEditor();
    BlogImage::factory()->create(['uploaded_by_id' => $mine->id]);
    BlogImage::factory()->count(2)->create(['uploaded_by_id' => $other->id]);

    $this->actingAs($mine)->getJson(route('admin.blog.images.index'))->assertOk()->assertJsonPath('meta.total', 1);
    $this->actingAs(blogAdmin())->getJson(route('admin.blog.images.index'))->assertOk()->assertJsonPath('meta.total', 3);
});

test('editors delete their own unused images, never someone else\'s, and never one in use', function () {
    Storage::fake('public');
    $mine = blogEditor();
    $own = BlogImage::factory()->create(['uploaded_by_id' => $mine->id]);
    $theirs = BlogImage::factory()->create(['uploaded_by_id' => blogEditor()->id]);
    $inUse = BlogImage::factory()->create(['uploaded_by_id' => $mine->id]);
    BlogPost::factory()->create()->images()->attach($inUse->id);

    $this->actingAs($mine)->deleteJson(route('admin.blog.images.destroy', $theirs))->assertNotFound();
    $this->actingAs($mine)->deleteJson(route('admin.blog.images.destroy', $inUse))->assertUnprocessable();
    $this->actingAs($mine)->deleteJson(route('admin.blog.images.destroy', $own))->assertNoContent();

    expect(BlogImage::query()->whereKey($own->id)->exists())->toBeFalse()
        ->and(BlogImage::query()->whereKey($theirs->id)->exists())->toBeTrue()
        ->and(BlogImage::query()->whereKey($inUse->id)->exists())->toBeTrue();

    $this->actingAs(blogAdmin())->deleteJson(route('admin.blog.images.destroy', $theirs))->assertNoContent();
});
