<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\MediaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $original_filename
 * @property string $extension
 * @property string $storage_path
 * @property string $mime_type
 * @property string|null $description
 * @property string $scan_status
 * @property string $uploaded_by_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'original_filename',
    'extension',
    'storage_path',
    'mime_type',
    'description',
    'scan_status',
    'uploaded_by_id',
])]
final class Media extends Model
{
    /** @use HasFactory<MediaFactory> */
    use HasFactory, HasUlids;

    protected $table = 'media';

    /**
     * The user who uploaded this media file.
     *
     * @return BelongsTo<User, $this>
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    /**
     * Products that reference this media as their single video.
     *
     * @return HasMany<Product, $this>
     */
    public function videoProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'video_media_id');
    }
}
