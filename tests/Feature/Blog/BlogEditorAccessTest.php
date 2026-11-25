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

function editor(): User
{
    return User::factory()->create(['role' => 'editor']);
}

function adminUser(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function editorUpload(int $width = 900, int $height = 600): UploadedFile
{
    $image = imagecreatetruecolor($width, $height);
    imagefill($image, 0, 0, (int) imagecolorallocate($image, 20, 90, 50));
    ob_start();
    imagejpeg($image);

    return UploadedFile::fake()->createWithContent('photo.jpg', (string) ob_get_clean());
}

test('role helpers distinguish admins, editors and everyone else', function () {
    expect(editor()->isEditor())->toBeTrue()
        ->and(editor()->isAdmin())->toBeFalse()
        ->and(editor()->canManageBlog())->toBeTrue()
        ->and(adminUser()->canManageBlog())->toBeTrue()
        ->and(adminUser()->isEditor())->toBeFalse()
        ->and(User::factory()->create()->canManageBlog())->toBeFalse();
});

test('editors edit only posts they created, admins edit any', function () {
    $mine = editor();
    $other = editor();
    $post = BlogPost::factory()->create(['created_by_id' => $mine->id]);

    expect($mine->canEditBlogPost($post))->toBeTrue()
        ->and($other->canEditBlogPost($post))->toBeFalse()
        ->and(adminUser()->canEditBlogPost($post))->toBeTrue()
        ->and(User::factory()->create()->canEditBlogPost($post))->toBeFalse();
});

test('editors delete only their own drafts, admins delete any post', function () {
    $mine = editor();
    $draft = BlogPost::factory()->draft()->create(['created_by_id' => $mine->id]);
    $published = BlogPost::factory()->published()->create(['created_by_id' => $mine->id]);
    $theirs = BlogPost::factory()->draft()->create(['created_by_id' => editor()->id]);

    expect($mine->canDeleteBlogPost($draft))->toBeTrue()
        ->and($mine->canDeleteBlogPost($published))->toBeFalse()
        ->and($mine->canDeleteBlogPost($theirs))->toBeFalse()
        ->and(adminUser()->canDeleteBlogPost($published))->toBeTrue();
});

test('editors keep their buyer workspace and gain the admin workspace; admins stay admin-only', function () {
    $editor = editor();

    expect(Workspace::allowedFor($editor))->toBe([Workspace::Buyer, Workspace::Admin])
        ->and(Workspace::Admin->accessibleBy($editor))->toBeTrue()
        ->and(Workspace::Buyer->accessibleBy($editor))->toBeTrue()
        ->and(Workspace::Seller->accessibleBy($editor))->toBeFalse()
        ->and(Workspace::Admin->home($editor))->toBe('/admin/blog/posts')
        ->and(Workspace::Admin->home(adminUser()))->toBe('/admin/dashboard')
        ->and(Workspace::allowedFor(adminUser()))->toBe([Workspace::Admin])
        ->and(Workspace::Admin->accessibleBy(User::factory()->create()))->toBeFalse();
});

test('every admin route is admin-only unless it is a blog route, and blog routes are editor-visible', function () {
    $adminRoutes = collect(Route::getRoutes()->getRoutes())
        ->filter(fn ($route) => str_starts_with((string) $route->getName(), 'admin.'));

    expect($adminRoutes)->not->toBeEmpty();

    foreach ($adminRoutes as $route) {
        $middleware = $route->gatherMiddleware();
        $name = $route->getName();

        expect($middleware)->toContain('workspace:admin', "{$name} lost workspace:admin");

        if (str_starts_with($name, 'admin.blog.')) {
            expect($middleware)->toContain('blog.manage', "{$name} must use blog.manage")
                ->not->toContain('admin.only', "{$name} would lock editors out");
        } else {
            expect($middleware)->toContain('admin.only', "{$name} is reachable by editors");
        }
    }
});

test('an editor gets 404 on admin screens outside the blog', function (string $routeName) {
    $this->actingAs(editor())->get(route($routeName))->assertNotFound();
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
    $this->actingAs(editor())->put(route('admin.settings.update'), [])->assertNotFound();
    $this->actingAs(editor())->post(route('admin.categories.store'), ['name' => 'X'])->assertNotFound();
});

test('buyers get 404 and guests are sent to login on the blog admin routes', function () {
    $this->actingAs(User::factory()->create())->getJson(route('admin.blog.images.index'))->assertNotFound();
    $this->getJson(route('admin.blog.images.index'))->assertUnauthorized();
});

test('an editor can upload an image and gets the markdown to insert', function () {
    Storage::fake('public');
    $editor = editor();

    $response = $this->actingAs($editor)->postJson(route('admin.blog.images.store'), [
        'image' => editorUpload(),
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

    $this->actingAs(editor())->postJson(route('admin.blog.images.store'), [
        'image' => UploadedFile::fake()->createWithContent('photo.jpg', 'not an image'),
        'purpose' => 'body',
        'alt' => 'x',
    ])->assertUnprocessable()->assertJsonValidationErrors('image');
});

test('an unknown purpose and a missing alt on a body image are 422s', function () {
    Storage::fake('public');
    $editor = editor();

    $this->actingAs($editor)->postJson(route('admin.blog.images.store'), ['image' => editorUpload(), 'purpose' => 'banner'])
        ->assertUnprocessable()->assertJsonValidationErrors('purpose');

    $this->actingAs($editor)->postJson(route('admin.blog.images.store'), ['image' => editorUpload(), 'purpose' => 'body'])
        ->assertUnprocessable()->assertJsonValidationErrors('image');
});

test('the library is scoped to the editor, and admins see everything', function () {
    Storage::fake('public');
    $mine = editor();
    $other = editor();
    BlogImage::factory()->create(['uploaded_by_id' => $mine->id]);
    BlogImage::factory()->count(2)->create(['uploaded_by_id' => $other->id]);

    $this->actingAs($mine)->getJson(route('admin.blog.images.index'))->assertOk()->assertJsonPath('meta.total', 1);
    $this->actingAs(adminUser())->getJson(route('admin.blog.images.index'))->assertOk()->assertJsonPath('meta.total', 3);
});

test('editors delete their own unused images, never someone else\'s, and never one in use', function () {
    Storage::fake('public');
    $mine = editor();
    $own = BlogImage::factory()->create(['uploaded_by_id' => $mine->id]);
    $theirs = BlogImage::factory()->create(['uploaded_by_id' => editor()->id]);
    $inUse = BlogImage::factory()->create(['uploaded_by_id' => $mine->id]);
    BlogPost::factory()->create()->images()->attach($inUse->id);

    $this->actingAs($mine)->deleteJson(route('admin.blog.images.destroy', $theirs))->assertNotFound();
    $this->actingAs($mine)->deleteJson(route('admin.blog.images.destroy', $inUse))->assertUnprocessable();
    $this->actingAs($mine)->deleteJson(route('admin.blog.images.destroy', $own))->assertNoContent();

    expect(BlogImage::query()->whereKey($own->id)->exists())->toBeFalse()
        ->and(BlogImage::query()->whereKey($theirs->id)->exists())->toBeTrue()
        ->and(BlogImage::query()->whereKey($inUse->id)->exists())->toBeTrue();

    $this->actingAs(adminUser())->deleteJson(route('admin.blog.images.destroy', $theirs))->assertNoContent();
});
