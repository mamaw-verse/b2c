<?php

declare(strict_types=1);

namespace App\Enums;

enum VoucherKind: string
{
    case Shop = 'shop';
    case Platform = 'platform';
    case Shipping = 'shipping';
}
