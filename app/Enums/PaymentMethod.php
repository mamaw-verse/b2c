<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case Cod = 'cod';
    case Ewallet = 'ewallet';
    case Card = 'card';
    case Banking = 'banking';
}
