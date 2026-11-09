<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\ValidatesVoucher;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateAdminVoucherRequest extends FormRequest
{
    use ValidatesVoucher;

    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->voucherRules(),
            'kind' => ['required', Rule::in(['platform', 'shipping'])],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function voucherPayload(): array
    {
        return $this->voucherData($this->string('kind')->toString());
    }
}
