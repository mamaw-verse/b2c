<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ShopStaffStatus;
use Database\Factories\ShopStaffFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $shop_id
 * @property string|null $user_id
 * @property string $email
 * @property ShopStaffStatus $status
 * @property string $invited_by
 * @property Carbon|null $invited_at
 * @property Carbon|null $accepted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['shop_id', 'user_id', 'email', 'status', 'invited_by', 'invited_at', 'accepted_at'])]
final class ShopStaff extends Model
{
    /** @use HasFactory<ShopStaffFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    protected function casts(): array
    {
        return [
            'status' => ShopStaffStatus::class,
            'invited_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }
}
