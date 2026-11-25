<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Concerns\BlogPostValidationRules;
use App\Enums\BlogPostStatus;
use App\Models\BlogAuthor;
use App\Models\BlogPost;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class UpdateBlogPostRequest extends FormRequest
{
    use BlogPostValidationRules;

    public function authorize(): Response
    {
        $post = $this->route('post');

        return $post instanceof BlogPost && $this->user()?->canEditBlogPost($post)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    protected function prepareForValidation(): void
    {
        $this->defaultAuthorToOwnProfile();
    }

    private function post(): BlogPost
    {
        $post = $this->route('post');
        assert($post instanceof BlogPost);

        return $post;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->postRules($this->post());
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $post = $this->post();
                $authorId = (string) $this->input('blog_author_id');

                if ($authorId === $post->blog_author_id) {
                    return;
                }

                // Plan §4.7 #2: after publishing, only an admin may re-credit a post.
                if ($post->status !== BlogPostStatus::Draft && ! $this->user()?->isAdmin()) {
                    $validator->errors()->add('blog_author_id', 'Only an admin can change the author of a post that has been published.');

                    return;
                }

                if (BlogAuthor::query()->whereKey($authorId)->where('is_active', false)->exists()) {
                    $validator->errors()->add('blog_author_id', 'This author is deactivated. Choose an active author.');
                }
            },
        ];
    }
}
