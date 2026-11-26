<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogAuthor;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class CreateBlogAuthorReassignmentRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'to_author_id' => ['required', 'string', 'exists:blog_authors,id'],
        ];
    }

    public function target(): BlogAuthor
    {
        return BlogAuthor::query()->findOrFail((string) $this->validated('to_author_id'));
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

                $from = $this->route('author');
                $to = $this->target();

                if ($from instanceof BlogAuthor && $from->is($to)) {
                    $validator->errors()->add('to_author_id', 'Choose a different author.');

                    return;
                }

                // Same rule as publishing (plan §4.7 #3): never credit someone inactive or without consent.
                if (! $to->canBeCredited()) {
                    $validator->errors()->add('to_author_id', 'That author is inactive or has not consented to being credited.');
                }
            },
        ];
    }
}
