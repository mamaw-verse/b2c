<?php

declare(strict_types=1);

namespace App\Support\Blog;

/**
 * Result of `ValidateBlogPostForPublish` (plan §5.3). `errors` block publishing, `warnings` never do.
 */
final readonly class BlogPublishCheck
{
    /**
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     */
    public function __construct(public array $errors, public array $warnings) {}

    public function passes(): bool
    {
        return $this->errors === [];
    }

    /**
     * @return array{errors: list<string>, warnings: list<string>, can_publish: bool}
     */
    public function toArray(): array
    {
        return ['errors' => $this->errors, 'warnings' => $this->warnings, 'can_publish' => $this->passes()];
    }
}
