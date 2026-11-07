<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $user_id
 * @property string $shop_id
 * @property string $address_id
 * @property string $shipping_option_id
 * @property string|null $voucher_id
 * @property string|null $platform_voucher_id
 * @property PaymentMethod $payment_method
 * @property OrderStatus $status
 * @property int $subtotal
 * @property int $shipping_fee
 * @property int $shipping_discount
 * @property int $voucher_discount
 * @property int $platform_voucher_discount
 * @property int $total
 * @property int $cod_fee
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'shop_id', 'address_id', 'shipping_option_id', 'voucher_id', 'platform_voucher_id', 'payment_method', 'status', 'subtotal', 'shipping_fee', 'shipping_discount', 'voucher_discount', 'platform_voucher_discount', 'total', 'cod_fee', 'notes'])]
final class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /** @return BelongsTo<Address, $this> */
    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    /** @return BelongsTo<ShippingOption, $this> */
    public function shippingOption(): BelongsTo
    {
        return $this->belongsTo(ShippingOption::class);
    }

    /** @return BelongsTo<Voucher, $this> */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    /** @return BelongsTo<Voucher, $this> */
    public function platformVoucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class, 'platform_voucher_id');
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasMany<OrderEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(OrderEvent::class)->orderByDesc('created_at');
    }

    /** @return HasOne<Payment, $this> */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    protected function casts(): array
    {
        return [
            'payment_method' => PaymentMethod::class,
            'status' => OrderStatus::class,
            'subtotal' => 'integer',
            'shipping_fee' => 'integer',
            'shipping_discount' => 'integer',
            'voucher_discount' => 'integer',
            'platform_voucher_discount' => 'integer',
            'total' => 'integer',
            'cod_fee' => 'integer',
        ];
    }
}
