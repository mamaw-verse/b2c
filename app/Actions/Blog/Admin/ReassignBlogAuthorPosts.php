<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Actions\Blog\InvalidateBlogCache;
use App\Models\BlogAuthor;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Moves every post credited to one author to another (docs/planning/15-blog.md B4.4), typically
 * after an author is deactivated or an editor is removed (plan §4.7 #5). Trashed posts move too,
 * so a later restore does not bring back a credit to someone who is gone.
 *
 * The update goes through the base query builder on purpose: it fires no per-post model events
 * (the cache is cleared once, below) and leaves `updated_at` alone, because a byline change is not
 * a content update and must not move the post's "Updated" date or its JSON-LD `dateModified`.
 */
final readonly class ReassignBlogAuthorPosts
{
    /** Post ids stored in the audit row; larger moves record the count only. */
    private const int AUDIT_ID_LIMIT = 500;

    public function __construct(
        private RecordAuditLog $audit,
        private InvalidateBlogCache $invalidate,
    ) {}

    /**
     * @return int number of posts moved
     */
    public function handle(BlogAuthor $from, BlogAuthor $to, User $admin, ?string $ip = null): int
    {
        $moved = DB::transaction(function () use ($from, $to, $admin, $ip): int {
            $query = BlogPost::withTrashed()->where('blog_author_id', $from->id);

            $ids = (clone $query)->pluck('id')->all();

            if ($ids === []) {
                return 0;
            }

            $count = $query->toBase()->update(['blog_author_id' => $to->id]);

            $this->audit->handle($admin, 'blog.author.posts_reassigned', $from, [
                'from_author_id' => $from->id,
                'to_author_id' => $to->id,
                'count' => $count,
                'post_ids' => count($ids) <= self::AUDIT_ID_LIMIT ? $ids : null,
            ], $ip);

            return $count;
        });

        if ($moved > 0) {
            $this->invalidate->handle();
        }

        return $moved;
    }
}
