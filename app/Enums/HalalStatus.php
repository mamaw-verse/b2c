<?php

declare(strict_types=1);

namespace App\Enums;

enum HalalStatus: string
{
    case Certified = 'certified';
    case Review = 'review';
    case Expiring = 'expiring';
    case Expired = 'expired';
    case Missing = 'missing';
    case NotApplicable = 'na';

    public function visibleToBuyers(): bool
    {
        return in_array($this, [self::Certified, self::Expiring, self::NotApplicable], true);
    }
}
