<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateActiveShopRequest extends FormRequest
{
    /**
     * Any verified, non-admin account may reach the endpoint; whether the
     * requested shop is one they operate is decided in the controller by
     * the live membership lookup, which answers 404 for strangers so a
     * shop id never confirms that the shop exists.
     */
    public function authorize(): Response
    {
        $user = $this->user();

        return ($user instanceof User && ! $user->isAdmin())
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'string', 'max:26'],
        ];
    }
}
