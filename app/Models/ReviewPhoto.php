<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ReviewPhotoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $review_id
 * @property string $path
 * @property int $position
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['review_id', 'path', 'position'])]
final class ReviewPhoto extends Model
{
    /** @use HasFactory<ReviewPhotoFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Review, $this> */
    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }
}
