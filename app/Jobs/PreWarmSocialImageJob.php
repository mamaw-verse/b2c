<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Seo\GenerateSocialImage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class PreWarmSocialImageJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $type,
        public readonly string $slug,
        public readonly ?string $version = null,
    ) {}

    public function handle(GenerateSocialImage $generator): void
    {
        $generator->handle($this->type, $this->slug, $this->version);
    }
}
