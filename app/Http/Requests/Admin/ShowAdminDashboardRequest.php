<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowAdminDashboardRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array{} */
    public function rules(): array
    {
        return [];
    }
}
