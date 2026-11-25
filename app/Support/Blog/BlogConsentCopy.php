<?php

declare(strict_types=1);

namespace App\Support\Blog;

/**
 * The consent and terms copy from docs/planning/15-blog.md Appendix A, in one place so it can
 * be revised (and reviewed by legal) without touching any logic. The accepted version is stored
 * from `config('blog.consent_version')`.
 */
final class BlogConsentCopy
{
    public static function version(): string
    {
        return (string) config('blog.consent_version', 'v1');
    }

    /**
     * A.1: shown on `editor-invitations/{id}`.
     *
     * @return array{title: string, body: string, checkbox: string}
     */
    public static function editorInvitation(): array
    {
        return [
            'title' => 'Be credited as an author',
            'body' => 'By accepting, you agree that HalalBenta may publish your display name, job title, short bio, photo and any links you add on your author page and on every article credited to you, including in search results and social previews. You can edit these details from your profile at any time, and you can ask an admin to deactivate your profile. Articles already published may remain online under your name unless you ask for them to be reassigned.',
            'checkbox' => 'I agree to be credited publicly as an author on HalalBenta.',
        ];
    }

    /**
     * A.2: admin form for a guest author.
     */
    public static function guestAuthor(): string
    {
        return 'I confirm this person has agreed to be credited by name on HalalBenta, and that the name, photo, bio and links entered here are the ones they approved.';
    }

    /**
     * A.2: an admin creating their own author profile.
     */
    public static function adminSelf(): string
    {
        return 'I agree to be credited publicly as an author on HalalBenta under the details above.';
    }

    /**
     * A.3: seller stories (Phase 6, not wired yet).
     *
     * @return array{title: string, body: string, checkbox: string}
     */
    public static function sellerStory(): array
    {
        return [
            'title' => 'Seller content terms',
            'body' => 'By submitting this story you confirm that you own or have permission to use all text and images in it, that it does not make halal-certification or health claims that are not true and documented, and that HalalBenta may edit it for clarity, publish it on the HalalBenta blog and credit your shop by name. HalalBenta may decline or remove a story at any time, for example if your shop is suspended.',
            'checkbox' => 'I accept the Seller content terms for this story.',
        ];
    }
}
