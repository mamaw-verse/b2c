<?php

declare(strict_types=1);

namespace App\Enums;

enum AddressLabel: string
{
    case Home = 'home';
    case Work = 'work';
    case Other = 'other';
}
