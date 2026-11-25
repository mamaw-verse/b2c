<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Actions\Blog\Admin\ValidateBlogPostForPublish;
use App\Models\BlogPost;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

/** Publish or schedule a post: the server-side gate from plan §5.3 runs in `after()`. */
final class CreateBlogPostPublicationRequest extends FormRequest
{
    public function authorize(): Response
    {
        $post = $this->route('post');

        return $post instanceof BlogPost && $this->user()?->canEditBlogPost($post)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'published_at' => ['nullable', 'date'],
        ];
    }

    public function publishedAt(): ?Carbon
    {
        $value = $this->validated('published_at');

        return $value === null || $value === '' ? null : Carbon::parse((string) $value);
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

                $post = $this->route('post');
                assert($post instanceof BlogPost);

                $check = app(ValidateBlogPostForPublish::class)->handle($post);
                foreach ($check->errors as $error) {
                    $validator->errors()->add('publish', $error);
                }
            },
        ];
    }
}
