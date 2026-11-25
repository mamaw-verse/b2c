<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowNewBlogPostRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->canManageBlog() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
