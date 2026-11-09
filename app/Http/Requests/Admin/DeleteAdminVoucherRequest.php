<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Voucher;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteAdminVoucherRequest extends FormRequest
{
    public function authorize(): Response
    {
        $voucher = $this->route('voucher');
        assert($voucher instanceof Voucher);

        return ($this->user()?->isAdmin() && $voucher->shop_id === null)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
