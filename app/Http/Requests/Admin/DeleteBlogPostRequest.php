<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogPost;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteBlogPostRequest extends FormRequest
{
    public function authorize(): Response
    {
        $post = $this->route('post');

        return $post instanceof BlogPost && $this->user()?->canDeleteBlogPost($post)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
