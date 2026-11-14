<?php

declare(strict_types=1);

namespace App\Enums;

enum ShopStaffStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
}
