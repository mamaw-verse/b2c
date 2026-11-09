<?php

declare(strict_types=1);

namespace App\Enums;

enum PayoutStatus: string
{
    case Requested = 'requested';
    case Paid = 'paid';
    case Rejected = 'rejected';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
