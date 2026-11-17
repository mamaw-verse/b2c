<?php

declare(strict_types=1);

use App\Jobs\ScanUploadedFileJob;
use App\Models\User;
use App\Services\MediaUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Config::set('filesystems.media_disk', 's3');
});

function videoUploadFile(string $filename, string $mimeType, int $bytes = 1024, ?string $clientMimeType = null): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'video-upload-');
    file_put_contents($path, str_repeat('v', $bytes));

    return new class($path, $filename, $clientMimeType ?? $mimeType, UPLOAD_ERR_OK, true, $mimeType) extends UploadedFile
    {
        public function __construct(
            string $path,
            string $originalName,
            ?string $mimeType,
            int $error,
            bool $test,
            private readonly string $detectedMimeType,
        ) {
            parent::__construct($path, $originalName, $mimeType, $error, $test);
        }

        public function __destruct()
        {
            if (is_file($this->getPathname())) {
                unlink($this->getPathname());
            }
        }

        public function getMimeType(): ?string
        {
            return $this->detectedMimeType;
        }
    };
}

test('video uploads accept matching mp4 and webm types and store on s3', function (string $filename, string $mimeType): void {
    Config::set('services.clamav.enabled', false);
    Storage::fake('s3');
    Queue::fake();

    $uploader = User::factory()->create();
    $media = app(MediaUploadService::class)->storeVideo(videoUploadFile($filename, $mimeType), $uploader->id);

    expect($media->extension)->toBe(pathinfo($filename, PATHINFO_EXTENSION))
        ->and($media->mime_type)->toBe($mimeType)
        ->and($media->scan_status)->toBe('clean')
        ->and($media->uploaded_by_id)->toBe($uploader->id);

    Storage::disk('s3')->assertExists($media->storage_path);
    Queue::assertNotPushed(ScanUploadedFileJob::class);
})->with([
    'mp4' => ['product.mp4', 'video/mp4'],
    'webm' => ['product.webm', 'video/webm'],
]);

test('video uploads dispatch scan job when clamav is enabled', function (): void {
    Config::set('services.clamav.enabled', true);
    Storage::fake('s3');
    Queue::fake();

    $uploader = User::factory()->create();
    $media = app(MediaUploadService::class)->storeVideo(videoUploadFile('product.mp4', 'video/mp4'), $uploader->id);

    expect($media->scan_status)->toBe('pending');
    Queue::assertPushed(ScanUploadedFileJob::class);
});

test('video uploads reject unsupported, mismatched, and oversized files', function (string $filename, string $mimeType, int $bytes, string $message, ?string $clientMimeType = null): void {
    Config::set('marketplace.video.max_kb', 1);
    Storage::fake('s3');
    $uploader = User::factory()->create();

    try {
        app(MediaUploadService::class)->storeVideo(videoUploadFile($filename, $mimeType, $bytes, $clientMimeType), $uploader->id);
    } catch (ValidationException $exception) {
        expect($exception->errors()['file'])->toContain($message);

        return;
    }

    $this->fail('The invalid video upload should have been rejected.');
})->with([
    'mov files are unsupported' => ['product.mov', 'video/quicktime', 512, 'Only MP4 and WebM videos are allowed.'],
    'mismatched extension is rejected' => ['product.webm', 'video/mp4', 512, 'The video extension does not match its file type.'],
    'oversized files are rejected' => ['product.mp4', 'video/mp4', 2048, 'The video must not exceed 1 MB.'],
    'renamed executables are rejected' => ['product.mp4', 'application/x-dosexec', 512, 'Only MP4 and WebM videos are allowed.', 'video/mp4'],
]);

test('video uploads use the configured storage prefix', function (): void {
    Config::set('marketplace.video.storage_prefix', 'test-media/videos');
    Config::set('services.clamav.enabled', false);
    Storage::fake('s3');

    $uploader = User::factory()->create();
    $media = app(MediaUploadService::class)->storeVideo(videoUploadFile('product.mp4', 'video/mp4'), $uploader->id);

    expect($media->storage_path)->toStartWith('test-media/videos/');
});
