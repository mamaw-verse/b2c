<?php

declare(strict_types=1);

namespace App\Http\Requests\Notification;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListNotificationsRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user() instanceof User ? Response::allow() : Response::deny();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
