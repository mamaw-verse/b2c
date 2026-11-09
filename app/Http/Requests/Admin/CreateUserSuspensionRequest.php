<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateUserSuspensionRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();

        if (! $user?->isAdmin()) {
            return Response::denyAsNotFound();
        }

        $target = $this->route('user');
        assert($target instanceof User);

        // Admins cannot suspend themselves or other admins.
        if ($target->is($user) || $target->isAdmin()) {
            return Response::deny();
        }

        return Response::allow();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
