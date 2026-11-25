<?php

declare(strict_types=1);

use App\Actions\Blog\DeleteBlogImage;
use App\Actions\Blog\ListBlogImages;
use App\Actions\Blog\StoreBlogImage;
use App\Jobs\ReconcileBlogImageOrphansJob;
use App\Models\BlogAuthor;
use App\Models\BlogImage;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (! extension_loaded('gd')) {
        test()->markTestSkipped('The GD extension is required.');
    }

    Storage::fake('public');
    config(['blog.images.disk' => 'public']);
});

/** A real image encoded with GD, wrapped as an upload. */
function blogUpload(int $width, int $height, string $format = 'jpeg', string $name = 'photo.jpg'): UploadedFile
{
    $image = imagecreatetruecolor($width, $height);
    imagefill($image, 0, 0, (int) imagecolorallocate($image, 30, 120, 60));

    ob_start();
    match ($format) {
        'png' => imagepng($image),
        'gif' => imagegif($image),
        'webp' => imagewebp($image),
        default => imagejpeg($image),
    };

    return UploadedFile::fake()->createWithContent($name, (string) ob_get_clean());
}

function storeBlogImage(UploadedFile $file, string $purpose = 'body', ?string $alt = 'Alt text', ?User $user = null): BlogImage
{
    return app(StoreBlogImage::class)->handle($user ?? User::factory()->create(), $file, $purpose, $alt);
}

function imageSize(string $path): array
{
    $info = getimagesizefromstring(Storage::disk('public')->get($path));

    return [$info[0], $info[1]];
}

test('a cover is stored with every variant at the expected size', function () {
    $user = User::factory()->create();
    $image = storeBlogImage(blogUpload(2000, 1100), 'cover', 'A cover', $user);

    expect($image->uploaded_by_id)->toBe($user->id)
        ->and($image->purpose)->toBe('cover')
        ->and($image->alt)->toBe('A cover')
        ->and($image->variants)->toHaveKeys(['thumb', 'medium', 'large', 'og']);

    foreach ($image->variants as $name => $variant) {
        expect(Storage::disk('public')->exists($variant['path']))->toBeTrue("{$name} file missing");
        expect(imageSize($variant['path']))->toBe([$variant['width'], $variant['height']]);
    }

    expect($image->variants['thumb']['width'])->toBe(480)
        ->and($image->variants['medium']['width'])->toBe(960)
        ->and($image->variants['large']['width'])->toBe(1600)
        ->and(imageSize($image->variants['og']['path']))->toBe([1200, 630])
        ->and(Storage::disk('public')->exists($image->original_path))->toBeTrue();
});

test('variants are never upscaled', function () {
    $image = storeBlogImage(blogUpload(1300, 700), 'cover');

    expect($image->variants)->toHaveKeys(['thumb', 'medium', 'og'])->not->toHaveKey('large')
        ->and($image->variants['medium']['width'])->toBe(960);
});

test('the stored original is capped at 2400 px on the longest side', function () {
    $image = storeBlogImage(blogUpload(3000, 1500), 'body');

    expect(max($image->width, $image->height))->toBe(2400)
        ->and(imageSize($image->original_path))->toBe([2400, 1200]);
});

test('an avatar becomes a 256 square', function () {
    $image = storeBlogImage(blogUpload(600, 400), 'avatar', null);

    expect($image->variants)->toHaveKey('avatar')->and($image->variants)->not->toHaveKey('large')
        ->and(imageSize($image->variants['avatar']['path']))->toBe([256, 256]);
});

test('png and webp uploads are accepted', function () {
    expect(storeBlogImage(blogUpload(1000, 600, 'png', 'a.png'))->original_path)->toEndWith('.jpg');
    expect(storeBlogImage(blogUpload(1000, 600, 'webp', 'a.webp'))->original_path)->toEndWith('.jpg');
});

test('a non-image renamed to .jpg is rejected', function () {
    $file = UploadedFile::fake()->createWithContent('photo.jpg', "<?php echo 'not an image';");

    expect(fn () => storeBlogImage($file))->toThrow(ValidationException::class);
    expect(BlogImage::query()->count())->toBe(0);
});

test('gif and svg uploads are rejected', function () {
    expect(fn () => storeBlogImage(blogUpload(800, 600, 'gif', 'a.gif')))->toThrow(ValidationException::class);

    $svg = UploadedFile::fake()->createWithContent('a.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>');
    expect(fn () => storeBlogImage($svg))->toThrow(ValidationException::class);
});

test('a file over the size limit is rejected', function () {
    $source = blogUpload(800, 600);
    $bytes = (string) file_get_contents((string) $source->getRealPath());
    $file = UploadedFile::fake()->createWithContent('big.jpg', $bytes)->size(4000);

    expect(fn () => storeBlogImage($file))->toThrow(ValidationException::class, 'larger than');
});

test('an image over the pixel or side limit is rejected before it is decoded', function () {
    // PNG header only: claims 6001x100, so the side limit trips without allocating a bitmap.
    $header = "\x89PNG\r\n\x1a\n".pack('N', 13).'IHDR'.pack('NN', 6001, 100)."\x08\x02\x00\x00\x00".pack('N', 0);
    $file = UploadedFile::fake()->createWithContent('wide.png', $header);

    expect(fn () => storeBlogImage($file))->toThrow(ValidationException::class);
});

test('covers and avatars below their minimum size are rejected', function () {
    expect(fn () => storeBlogImage(blogUpload(1000, 500), 'cover'))->toThrow(ValidationException::class, '1200x630');
    expect(fn () => storeBlogImage(blogUpload(200, 200), 'avatar', null))->toThrow(ValidationException::class, '256x256');
});

test('alt text is required for cover and body images only', function () {
    expect(fn () => storeBlogImage(blogUpload(1300, 700), 'cover', ''))->toThrow(ValidationException::class, 'Alt text');
    expect(fn () => storeBlogImage(blogUpload(800, 600), 'body', null))->toThrow(ValidationException::class, 'Alt text');

    expect(storeBlogImage(blogUpload(600, 400), 'thumbnail', null)->alt)->toBeNull();
});

test('metadata segments and trailing payloads do not survive re-encoding', function () {
    $source = blogUpload(900, 600);
    $jpeg = (string) file_get_contents((string) $source->getRealPath());
    $sentinel = 'GPSLatitude-SENTINEL-51.5N';
    $payload = "Exif\0\0".$sentinel;
    $tainted = mb_substr($jpeg, 0, 2, '8bit')."\xFF\xE1".pack('n', mb_strlen($payload, '8bit') + 2).$payload.mb_substr($jpeg, 2, null, '8bit')."<?php system('id'); ?>";

    $image = storeBlogImage(UploadedFile::fake()->createWithContent('photo.jpg', $tainted));

    foreach ($image->storedPaths() as $path) {
        $bytes = Storage::disk('public')->get($path);
        expect($bytes)->not->toContain($sentinel)->not->toContain('Exif')->not->toContain('<?php');
    }
});

test('files are written under a dated, randomised path, not the upload name', function () {
    $image = storeBlogImage(blogUpload(900, 600, 'jpeg', 'my secret name.jpg'));

    expect($image->original_path)->toStartWith('blog-images/'.now()->format('Y/m').'/')
        ->not->toContain('secret');
});

test('an unknown purpose is rejected', function () {
    expect(fn () => storeBlogImage(blogUpload(900, 600), 'banner'))->toThrow(ValidationException::class);
});

test('a referenced image cannot be deleted, an unreferenced one can', function () {
    $image = storeBlogImage(blogUpload(900, 600));
    $paths = $image->storedPaths();

    $post = BlogPost::factory()->create();
    $post->images()->attach($image->id);

    expect(fn () => app(DeleteBlogImage::class)->handle($image))->toThrow(ValidationException::class);
    expect(BlogImage::query()->whereKey($image->id)->exists())->toBeTrue();

    $post->images()->detach($image->id);
    app(DeleteBlogImage::class)->handle($image->refresh());

    expect(BlogImage::query()->whereKey($image->id)->exists())->toBeFalse();
    foreach ($paths as $path) {
        expect(Storage::disk('public')->exists($path))->toBeFalse();
    }
});

test('a cover, thumbnail or author avatar also counts as a reference', function () {
    $cover = storeBlogImage(blogUpload(1300, 700), 'cover');
    $avatar = storeBlogImage(blogUpload(400, 400), 'avatar', null);

    BlogPost::factory()->create(['cover_image_id' => $cover->id]);
    BlogAuthor::factory()->create(['avatar_image_id' => $avatar->id]);

    expect($cover->isReferenced())->toBeTrue()->and($avatar->isReferenced())->toBeTrue();
});

test('the orphan job removes old unreferenced images and keeps the rest', function () {
    $orphan = storeBlogImage(blogUpload(900, 600));
    $used = storeBlogImage(blogUpload(900, 600));
    $recent = storeBlogImage(blogUpload(900, 600));

    BlogPost::factory()->create()->images()->attach($used->id);

    BlogImage::query()->whereIn('id', [$orphan->id, $used->id])->update(['created_at' => now()->subDays(10)]);

    (new ReconcileBlogImageOrphansJob)->handle();

    expect(BlogImage::query()->whereKey($orphan->id)->exists())->toBeFalse()
        ->and(BlogImage::query()->whereKey($used->id)->exists())->toBeTrue()
        ->and(BlogImage::query()->whereKey($recent->id)->exists())->toBeTrue();

    foreach ($orphan->storedPaths() as $path) {
        expect(Storage::disk('public')->exists($path))->toBeFalse();
    }
});

test('the library shows editors only their own uploads and admins everything', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $editor = User::factory()->create(['role' => 'editor']);
    $other = User::factory()->create(['role' => 'editor']);

    storeBlogImage(blogUpload(900, 600), 'body', 'a', $editor);
    storeBlogImage(blogUpload(900, 600), 'body', 'b', $other);
    storeBlogImage(blogUpload(900, 600), 'body', 'c', $admin);

    $list = app(ListBlogImages::class);

    expect($list->handle($editor)->total())->toBe(1)
        ->and($list->handle($admin)->total())->toBe(3)
        ->and($list->handle($admin, 'cover')->total())->toBe(0);
});
