<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Http\Requests\Concerns\ValidatesVoucher;
use App\Models\Voucher;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateAdminVoucherRequest extends FormRequest
{
    use ValidatesVoucher;

    public function authorize(): Response
    {
        $voucher = $this->route('voucher');
        assert($voucher instanceof Voucher);

        return ($this->user()?->isAdmin() && $voucher->shop_id === null)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $voucher = $this->route('voucher');
        assert($voucher instanceof Voucher);

        return [
            ...$this->voucherRules($voucher),
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
