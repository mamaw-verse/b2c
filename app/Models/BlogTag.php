<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BlogTagFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property string $id
 * @property string $name
 * @property string $slug
 */
#[Fillable(['name', 'slug'])]
final class BlogTag extends Model
{
    /** @use HasFactory<BlogTagFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsToMany<BlogPost, $this> */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(BlogPost::class, 'blog_post_tag');
    }
}
