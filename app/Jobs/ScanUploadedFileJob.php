<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class ScanUploadedFileJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying.
     */
    public int $backoff = 30;

    public function __construct(
        public readonly Media $media,
    ) {}

    /**
     * Execute the job — scan the file for malware using ClamAV.
     *
     * When scanning is disabled (CLAMAV_ENABLED=false) any pending record
     * is marked clean immediately.
     */
    public function handle(): void
    {
        if (! (bool) config('services.clamav.enabled', false)) {
            if ($this->media->scan_status !== 'clean') {
                $this->markStatus('clean');
            }

            Log::info('ScanUploadedFileJob: Scanning disabled, marked clean.', [
                'media_id' => $this->media->id,
            ]);

            return;
        }

        $fileStream = Storage::disk('s3')->readStream($this->media->storage_path);

        if (! is_resource($fileStream)) {
            Log::warning('ScanUploadedFileJob: File not found in S3.', [
                'media_id' => $this->media->id,
                'path' => $this->media->storage_path,
            ]);
            $this->markStatus('infected');

            return;
        }

        try {
            $scanResult = $this->scanWithClamAv($fileStream);
        } finally {
            fclose($fileStream);
        }

        $this->markStatus($scanResult);

        Log::info('ScanUploadedFileJob: Scan complete.', [
            'media_id' => $this->media->id,
            'result' => $scanResult,
        ]);
    }

    /**
     * Scan file content using ClamAV via TCP socket connection.
     *
     * Uses the INSTREAM command to scan content without writing to disk.
     * Returns 'clean' or 'infected'.
     *
     * @param  resource  $fileStream
     */
    private function scanWithClamAv(mixed $fileStream): string
    {
        $host = (string) config('services.clamav.host', 'localhost');
        $port = (int) config('services.clamav.port', 3310);
        $timeout = (int) config('services.clamav.timeout', 30);

        $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);

        if ($socket === false) {
            Log::warning('ScanUploadedFileJob: ClamAV connection failed.', [
                'host' => $host,
                'port' => $port,
                'error' => "{$errno}: {$errstr}",
            ]);

            // In dev environments without ClamAV, default to clean
            if ((bool) config('services.clamav.skip_when_unavailable', false)) {
                return 'clean';
            }

            // In production, fail the job so it retries
            $this->fail(new RuntimeException("ClamAV unavailable: {$errno} {$errstr}"));

            return 'pending';
        }

        try {
            fwrite($socket, "zINSTREAM\0");

            $chunkSize = 2 * 1024 * 1024;

            while (! feof($fileStream)) {
                $chunk = fread($fileStream, $chunkSize);

                if ($chunk === false) {
                    throw new RuntimeException('Unable to read uploaded file stream.');
                }

                if ($chunk === '') {
                    if (feof($fileStream)) {
                        break;
                    }

                    continue;
                }

                fwrite($socket, pack('N', mb_strlen($chunk)).$chunk);
            }

            fwrite($socket, pack('N', 0));

            $response = '';
            while (! feof($socket)) {
                $response .= fread($socket, 4096);
            }

            $response = mb_trim($response);

            if (str_contains($response, 'OK')) {
                return 'clean';
            }

            Log::warning('ScanUploadedFileJob: Threat detected.', [
                'media_id' => $this->media->id,
                'response' => $response,
            ]);

            return 'infected';
        } finally {
            fclose($socket);
        }
    }

    /**
     * Update the media record's scan_status.
     */
    private function markStatus(string $status): void
    {
        $this->media->update(['scan_status' => $status]);
    }
}
