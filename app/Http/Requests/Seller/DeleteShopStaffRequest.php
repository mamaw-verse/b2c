<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteShopStaffRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        $staff = $this->route('staff');
        assert($staff instanceof ShopStaff);

        $isOwner = $user->ownsShop() && $user->shop?->id === $staff->shop_id;
        $isSelf = $staff->user_id === $user->id;

        return ($isOwner || $isSelf)
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
