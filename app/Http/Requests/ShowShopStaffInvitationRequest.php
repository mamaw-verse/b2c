<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\ShopStaffStatus;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowShopStaffInvitationRequest extends FormRequest
{
    public function authorize(): Response
    {
        $staffInvitation = $this->route('staffInvitation');
        if (! $staffInvitation instanceof ShopStaff) {
            return Response::denyAsNotFound();
        }

        if ($staffInvitation->status !== ShopStaffStatus::Pending) {
            return Response::denyAsNotFound();
        }

        if ($staffInvitation->invited_at === null || $staffInvitation->invited_at->lt(now()->subDays(7))) {
            return Response::denyAsNotFound();
        }

        if (! $this->hasValidSignature()) {
            return Response::denyAsNotFound();
        }

        $user = $this->user();
        if ($user instanceof User) {
            if (mb_strtolower($user->email) !== mb_strtolower($staffInvitation->email)) {
                return Response::denyAsNotFound();
            }

            if ($user->ownsShop() || $user->isShopStaff()) {
                return Response::denyAsNotFound();
            }
        }

        return Response::allow();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
