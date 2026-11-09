<?php

declare(strict_types=1);

namespace App\Enums;

enum LedgerEntryType: string
{
    case Sale = 'sale';
    case Commission = 'commission';
    case PlatformVoucherReimbursement = 'platform_voucher_reimbursement';
    case Refund = 'refund';
    case Adjustment = 'adjustment';
    case Payout = 'payout';

    public function label(): string
    {
        return match ($this) {
            self::Sale => 'Sale',
            self::Commission => 'Commission',
            self::PlatformVoucherReimbursement => 'Platform voucher reimbursement',
            self::Refund => 'Refund',
            self::Adjustment => 'Adjustment',
            self::Payout => 'Payout',
        };
    }
}
