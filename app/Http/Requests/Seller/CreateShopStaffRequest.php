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

        return ($user->ownsShop() && ! $user->operatedShop()?->suspended)
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
        $shop = $user->operatedShop();
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
                // Membership is per shop: the same person may already staff
                // (or own) other shops. Only this shop's roster matters, and
                // that is covered by the unique (shop_id, email) rule above
                // plus the self-invite check.
                function (string $attribute, mixed $value, Closure $fail) use ($shop): void {
                    $email = mb_strtolower(mb_trim((string) $value));

                    $alreadyActiveHere = ShopStaff::query()
                        ->where('shop_id', $shop->id)
                        ->where('status', ShopStaffStatus::Active->value)
                        ->whereHas('user', fn ($q) => $q->whereRaw('LOWER(email) = ?', [$email]))
                        ->exists();

                    if ($alreadyActiveHere) {
                        $fail('This user is already staff at your shop.');
                    }
                },
                new ShopStaffLimit($shop),
            ],
        ];
    }
}
