<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case ToPay = 'to_pay';
    case ToShip = 'to_ship';
    case ToReceive = 'to_receive';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case ReturnRefund = 'return_refund';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::ToPay => 'To Pay',
            self::ToShip => 'To Ship',
            self::ToReceive => 'To Receive',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
            self::ReturnRefund => 'Return/Refund',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Pending => 'neutral',
            self::ToPay, self::ToShip => 'warning',
            self::ToReceive => 'info',
            self::Completed => 'success',
            self::Cancelled => 'neutral',
            self::ReturnRefund => 'danger',
        };
    }

    public function isCancellable(): bool
    {
        return in_array($this, [self::Pending, self::ToPay, self::ToShip], true);
    }

    public function isReturnable(): bool
    {
        return $this === self::Completed;
    }
}
