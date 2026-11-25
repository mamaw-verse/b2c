<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Role returns to buyer and the editor's author profile is deactivated. Posts stay credited
 * to the profile (plan §4.7 #5); an admin can reassign them later.
 */
final readonly class RemoveBlogEditor
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(User $editor, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($editor, $admin, $ip): void {
            $editor->update(['role' => 'buyer']);

            $author = BlogAuthor::query()->where('user_id', $editor->id)->first();
            $author?->update(['is_active' => false]);

            $this->audit->handle($admin, 'blog.editor.removed', $editor, [
                'email' => $editor->email,
                'author_id' => $author?->id,
            ], $ip);

            if ($author !== null) {
                $this->audit->handle($admin, 'blog.author.deactivated', $author, ['via' => 'editor_removed'], $ip);
            }
        });
    }
}
