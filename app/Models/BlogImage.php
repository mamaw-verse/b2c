<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BlogImageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property string $id
 * @property string|null $uploaded_by_id
 * @property string $purpose cover|thumbnail|body|avatar
 * @property string $disk
 * @property string $original_path
 * @property array<string, array{path: string, width: int, height: int}> $variants
 * @property int $width
 * @property int $height
 * @property int $bytes
 * @property string $mime
 * @property string|null $alt
 * @property string|null $caption
 */
#[Fillable([
    'uploaded_by_id', 'purpose', 'disk', 'original_path', 'variants',
    'width', 'height', 'bytes', 'mime', 'alt', 'caption',
])]
final class BlogImage extends Model
{
    /** @use HasFactory<BlogImageFactory> */
    use HasFactory, HasUlids;

    public const PURPOSES = ['cover', 'thumbnail', 'body', 'avatar'];

    /** @return BelongsTo<User, $this> */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    /** @return BelongsToMany<BlogPost, $this> */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(BlogPost::class, 'blog_post_images');
    }

    protected function casts(): array
    {
        return [
            'variants' => 'array',
            'width' => 'integer',
            'height' => 'integer',
            'bytes' => 'integer',
        ];
    }
}
