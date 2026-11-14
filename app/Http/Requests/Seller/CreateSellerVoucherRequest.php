<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Http\Requests\Concerns\ValidatesVoucher;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateSellerVoucherRequest extends FormRequest
{
    use ValidatesVoucher;

    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        return ($user->ownsShop() && ! $user->shop?->suspended) ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->voucherRules();
    }

    /**
     * @return array<string, mixed>
     */
    public function voucherPayload(): array
    {
        return $this->voucherData('shop');
    }
}
