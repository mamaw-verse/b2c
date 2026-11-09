<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Http\Requests\Concerns\ValidatesVoucher;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateSellerVoucherRequest extends FormRequest
{
    use ValidatesVoucher;

    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $voucher = $this->route('voucher');
        assert($voucher instanceof Voucher);

        return ($user->isSeller() && $voucher->shop_id === $user->shop?->id)
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

        return $this->voucherRules($voucher);
    }

    /**
     * @return array<string, mixed>
     */
    public function voucherPayload(): array
    {
        return $this->voucherData('shop');
    }
}
