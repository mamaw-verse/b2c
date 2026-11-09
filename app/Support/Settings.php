<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Arr;

/**
 * Runtime overrides for `config('marketplace')`. Rows in the `settings`
 * table are stored under `marketplace.<key>`; reads fall back to the
 * config/env value when no override exists. Overrides are cached until
 * `set()` invalidates them.
 */
final class Settings
{
    private const string CACHE_KEY = 'platform_settings';

    public function get(string $key): mixed
    {
        return $this->all()[$key] ?? null;
    }

    public function set(string $key, mixed $value): void
    {
        Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        cache()->forget(self::CACHE_KEY);
    }

    public function marketplace(string $key): mixed
    {
        return $this->get('marketplace.'.$key) ?? config('marketplace.'.$key);
    }

    public function marketplaceInt(string $key): int
    {
        return (int) ($this->marketplace($key) ?? 0);
    }

    /**
     * `config('marketplace')` with every stored `marketplace.*` override applied.
     *
     * @return array<string, mixed>
     */
    public function marketplaceConfig(): array
    {
        $config = config('marketplace');

        foreach ($this->all() as $key => $value) {
            if (str_starts_with($key, 'marketplace.')) {
                Arr::set($config, mb_substr($key, mb_strlen('marketplace.')), $value);
            }
        }

        return $config;
    }

    /**
     * @return array<string, mixed>
     */
    private function all(): array
    {
        return cache()->rememberForever(self::CACHE_KEY, fn () => Setting::query()->pluck('value', 'key')->all());
    }
}
