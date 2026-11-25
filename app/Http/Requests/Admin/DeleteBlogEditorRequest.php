<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteBlogEditorRequest extends FormRequest
{
    public function authorize(): Response
    {
        if (! $this->user()?->isAdmin()) {
            return Response::denyAsNotFound();
        }

        $editor = $this->route('editor');

        return $editor instanceof User && $editor->isEditor() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
