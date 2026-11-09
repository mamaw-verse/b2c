<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use App\Support\Settings;
use Illuminate\Support\Facades\DB;

final readonly class UpdatePlatformSettings
{
    private const array KEYS = [
        'commission_bps' => 'marketplace.commission.default_bps',
        'auto_confirm_days' => 'marketplace.auto_confirm_days',
        'return_window_days' => 'marketplace.return_window_days',
        'payout_hold_days' => 'marketplace.payouts.hold_days',
        'payout_minimum' => 'marketplace.payouts.minimum',
        'announcement' => 'marketplace.announcement',
    ];

    public function __construct(private Settings $settings, private RecordAuditLog $audit) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $admin, array $data, ?string $ip = null): void
    {
        DB::transaction(function () use ($admin, $data, $ip) {
            $changed = [];

            foreach (self::KEYS as $input => $key) {
                $value = $data[$input] ?? null;

                if ($value !== $this->settings->get($key)) {
                    $changed[] = $key;
                }

                $this->settings->set($key, $value);
            }

            $this->audit->handle($admin, 'settings.updated', null, ['keys' => $changed], $ip);
        });
    }
}
