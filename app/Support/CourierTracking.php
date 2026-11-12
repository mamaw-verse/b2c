<?php

declare(strict_types=1);

namespace App\Support;

final class CourierTracking
{
    public static function resolve(?string $courier, ?string $trackingNumber, ?string $explicitUrl = null): ?string
    {
        if ($explicitUrl !== null && mb_trim($explicitUrl) !== '') {
            return $explicitUrl;
        }

        if ($courier === null || $trackingNumber === null || mb_trim($trackingNumber) === '') {
            return null;
        }

        $normalized = mb_strtolower(mb_trim($courier));
        /** @var array<string, string> $templates */
        $templates = config('couriers.templates', []);

        $template = $templates[$normalized] ?? null;
        if ($template === null) {
            foreach ($templates as $key => $tpl) {
                if (str_contains($normalized, $key)) {
                    $template = $tpl;
                    break;
                }
            }
        }

        if ($template === null) {
            return null;
        }

        return str_replace('{number}', urlencode(mb_trim($trackingNumber)), $template);
    }
}
