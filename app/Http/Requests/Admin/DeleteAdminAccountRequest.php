<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteAdminAccountRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();

        if (! $user?->isAdmin()) {
            return Response::denyAsNotFound();
        }

        $target = $this->route('admin');
        assert($target instanceof User);

        // Admins cannot revoke themselves or non-admins.
        if ($target->is($user) || ! $target->isAdmin()) {
            return Response::deny();
        }

        // Cannot revoke the last remaining admin.
        if (User::query()->where('role', 'admin')->count() <= 1) {
            return Response::deny('Cannot revoke the last remaining admin.');
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
