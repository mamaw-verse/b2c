<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogAuthor;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class CreateBlogAuthorDeactivationRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $author = $this->route('author');
                if ($author instanceof BlogAuthor && $author->is_house) {
                    $validator->errors()->add('author', 'The house author cannot be deactivated.');
                }
            },
        ];
    }
}
