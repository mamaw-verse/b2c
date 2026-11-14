<?php

declare(strict_types=1);

namespace App\Rules;

use App\Enums\ShopStaffStatus;
use App\Models\Shop;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final readonly class ShopStaffLimit implements ValidationRule
{
    public function __construct(private Shop $shop) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $max = (int) config('marketplace.seller.max_staff', 2);
        $count = $this->shop->staff()
            ->whereIn('status', [ShopStaffStatus::Pending->value, ShopStaffStatus::Active->value])
            ->count();

        if ($count >= $max) {
            $fail("Your shop has reached the limit of {$max} staff members.");
        }
    }
}
