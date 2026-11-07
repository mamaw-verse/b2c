<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $conversation_id
 * @property string|null $sender_id
 * @property MessageSenderRole $sender_role
 * @property MessageType $type
 * @property string|null $body
 * @property string|null $product_id
 * @property string|null $order_id
 * @property Carbon|null $read_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['conversation_id', 'sender_id', 'sender_role', 'type', 'body', 'product_id', 'order_id', 'read_at'])]
final class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Conversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => MessageType::class,
            'sender_role' => MessageSenderRole::class,
            'read_at' => 'datetime',
        ];
    }
}
