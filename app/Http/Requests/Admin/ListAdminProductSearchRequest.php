<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListAdminProductSearchRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function queryTerm(): string
    {
        return mb_trim((string) $this->input('q', ''));
    }
}
