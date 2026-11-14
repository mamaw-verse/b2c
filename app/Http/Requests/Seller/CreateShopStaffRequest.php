<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Enums\ShopStaffStatus;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Rules\ShopStaffLimit;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateShopStaffRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        return ($user->ownsShop() && ! $user->shop?->suspended)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();
        assert($user instanceof User);
        $shop = $user->shop;
        assert($shop instanceof Shop);

        return [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                function (string $attribute, mixed $value, Closure $fail) use ($user): void {
                    if (mb_strtolower(mb_trim((string) $value)) === mb_strtolower($user->email)) {
                        $fail('You cannot invite yourself as shop staff.');
                    }
                },
                Rule::unique('shop_staff', 'email')->where('shop_id', $shop->id),
                function (string $attribute, mixed $value, Closure $fail): void {
                    $email = mb_strtolower(mb_trim((string) $value));
                    $existingUser = User::whereRaw('LOWER(email) = ?', [$email])->first();
                    if ($existingUser !== null) {
                        if ($existingUser->ownsShop()) {
                            $fail('This user is already the owner of a shop.');

                            return;
                        }
                        if ($existingUser->isShopStaff()) {
                            $fail('This user is already staff at another shop.');

                            return;
                        }
                    }

                    $hasActiveElsewhere = ShopStaff::whereRaw('LOWER(email) = ?', [$email])
                        ->where('status', ShopStaffStatus::Active->value)
                        ->exists();

                    if ($hasActiveElsewhere) {
                        $fail('This user is already staff at another shop.');
                    }
                },
                new ShopStaffLimit($shop),
            ],
        ];
    }
}
