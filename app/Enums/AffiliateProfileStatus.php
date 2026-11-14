<?php

declare(strict_types=1);

namespace App\Enums;

enum AffiliateProfileStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
}
