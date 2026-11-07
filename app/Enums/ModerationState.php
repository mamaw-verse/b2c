<?php

declare(strict_types=1);

namespace App\Enums;

enum ModerationState: string
{
    case Pending = 'pending';
    case Flagged = 'flagged';
    case Hidden = 'hidden';
    case Suspended = 'suspended';
    case Resolved = 'resolved';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Flagged => 'Flagged',
            self::Hidden => 'Hidden',
            self::Suspended => 'Suspended',
            self::Resolved => 'Resolved',
        };
    }
}
