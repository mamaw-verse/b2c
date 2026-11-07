<?php

declare(strict_types=1);

namespace App\Http\Requests\Report;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateReportRequest extends FormRequest
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
        return [
            'target_type' => ['required', 'string', 'in:product,review,shop,conversation,user'],
            'target_id' => ['required', 'string'],
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:1000'],
            'evidence' => ['nullable', 'array', 'max:5'],
            'evidence.*' => ['file', 'image', 'max:5120'], // 5MB max
        ];
    }
}
