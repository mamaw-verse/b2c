<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BlogAuthorFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $user_id
 * @property string $display_name
 * @property string $slug
 * @property string|null $job_title
 * @property string|null $bio
 * @property string|null $avatar_image_id
 * @property array<int, array{label: string, url: string}>|null $links
 * @property bool $is_house
 * @property bool $is_active
 * @property Carbon|null $consent_confirmed_at
 * @property string|null $consent_confirmed_by_id
 * @property string|null $consent_version
 */
#[Fillable([
    'user_id', 'display_name', 'slug', 'job_title', 'bio', 'avatar_image_id', 'links',
    'is_house', 'is_active', 'consent_confirmed_at', 'consent_confirmed_by_id', 'consent_version',
])]
final class BlogAuthor extends Model
{
    /** @use HasFactory<BlogAuthorFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<BlogImage, $this> */
    public function avatar(): BelongsTo
    {
        return $this->belongsTo(BlogImage::class, 'avatar_image_id');
    }

    /** @return HasMany<BlogPost, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(BlogPost::class);
    }

    /**
     * Whether posts credited to this author may be published (plan §4.7):
     * active, and either the house author or a person who consented.
     */
    public function canBeCredited(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        return $this->is_house || $this->consent_confirmed_at !== null;
    }

    /** @param Builder<BlogAuthor> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    protected function casts(): array
    {
        return [
            'links' => 'array',
            'is_house' => 'boolean',
            'is_active' => 'boolean',
            'consent_confirmed_at' => 'datetime',
        ];
    }
}
