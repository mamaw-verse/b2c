<?php

declare(strict_types=1);

namespace App\Enums;

enum MessageSenderRole: string
{
    case Buyer = 'buyer';
    case Seller = 'seller';
    case System = 'system';
}
