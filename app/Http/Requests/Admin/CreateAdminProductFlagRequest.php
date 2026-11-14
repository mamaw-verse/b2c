<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ModerationReason;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateAdminProductFlagRequest extends FormRequest
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
            'product_id' => ['required', 'string', 'exists:products,id'],
            'reason' => ['required', 'string', Rule::in(array_map(fn (ModerationReason $r) => $r->value, ModerationReason::reportDrivenCases()))],
            'note' => ['required', 'string', 'max:1000'],
        ];
    }

    public function productId(): string
    {
        return $this->validated('product_id');
    }

    public function flagReason(): string
    {
        return $this->validated('reason');
    }

    public function note(): string
    {
        return $this->string('note')->toString();
    }
}
