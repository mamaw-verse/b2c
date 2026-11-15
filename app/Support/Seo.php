<?php

declare(strict_types=1);

namespace App\Support;

final class Seo
{
    private ?SeoData $current = null;

    public function set(SeoData $data): void
    {
        $this->current = $data;
    }

    public function current(): ?SeoData
    {
        return $this->current;
    }

    public function resolve(): SeoData
    {
        return $this->current ?? SeoData::fallback();
    }
}
