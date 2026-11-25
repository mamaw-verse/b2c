<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateBlogAuthor
{
    private const EDITABLE = ['user_id', 'display_name', 'slug', 'job_title', 'bio', 'avatar_image_id', 'links'];

    public function __construct(private RecordAuditLog $audit) {}

    /**
     * Only the keys present in `$data` change, so the editor's self-service form (bio, job title,
     * avatar, links) and the admin form share this action. Consent is only ever recorded here,
     * never cleared, and an existing consent keeps its original timestamp and version.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(BlogAuthor $author, User $actor, array $data, bool $recordConsent = false, ?string $ip = null): BlogAuthor
    {
        return DB::transaction(function () use ($author, $actor, $data, $recordConsent, $ip): BlogAuthor {
            $changes = array_intersect_key($data, array_flip(self::EDITABLE));
            if (array_key_exists('links', $changes)) {
                $changes['links'] = ($changes['links'] ?? null) ?: null;
            }

            if ($recordConsent && $author->consent_confirmed_at === null) {
                $changes['consent_confirmed_at'] = now();
                $changes['consent_confirmed_by_id'] = $actor->id;
                $changes['consent_version'] = (string) config('blog.consent_version', 'v1');
            }

            $author->update($changes);

            $this->audit->handle($actor, 'blog.author.updated', $author, [
                'fields' => array_keys($changes),
            ], $ip);

            return $author;
        });
    }
}
