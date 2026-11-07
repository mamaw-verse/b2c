<?php

declare(strict_types=1);

namespace App\Enums;

enum ModerationItemType: string
{
    case General = 'general';
    case Halal = 'halal';
    case Report = 'report';
    case Keyword = 'keyword';
    case Expiry = 'expiry';

    public function label(): string
    {
        return match ($this) {
            self::General => 'General',
            self::Halal => 'Halal',
            self::Report => 'Report',
            self::Keyword => 'Keyword',
            self::Expiry => 'Expiry',
        };
    }
}
