<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogImage;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteBlogImageRequest extends FormRequest
{
    /** Admins delete any image; editors only their own uploads. */
    public function authorize(): Response
    {
        $user = $this->user();
        $image = $this->route('blogImage');

        $allowed = $user !== null
            && $image instanceof BlogImage
            && ($user->isAdmin() || ($user->isEditor() && $image->uploaded_by_id === $user->getKey()));

        return $allowed ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
