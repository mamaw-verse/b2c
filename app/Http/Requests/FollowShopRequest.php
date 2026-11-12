<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Shop;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class FollowShopRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();

        if ($user === null) {
            return Response::denyAsNotFound();
        }

        $shop = $this->route('shop');
        assert($shop instanceof Shop);

        return $shop->user_id !== $user->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array{} */
    public function rules(): array
    {
        return [];
    }
}
