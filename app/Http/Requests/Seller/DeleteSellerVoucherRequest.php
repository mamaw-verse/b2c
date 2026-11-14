<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use App\Models\Voucher;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteSellerVoucherRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        $voucher = $this->route('voucher');
        assert($voucher instanceof Voucher);

        return ($user->ownsShop() && ! $user->shop?->suspended && $voucher->shop_id === $user->shop?->id)
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
