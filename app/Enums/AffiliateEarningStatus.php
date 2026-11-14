<?php

declare(strict_types=1);

namespace App\Enums;

enum AffiliateEarningStatus: string
{
    case Pending = 'pending';
    case Available = 'available';
    case Cancelled = 'cancelled';
}
