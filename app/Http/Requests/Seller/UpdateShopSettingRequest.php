<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateShopSettingRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        return ($user->isSeller() && $user->shop()->exists())
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'vacation_mode' => ['boolean'],
            'auto_reply' => ['boolean'],
            'shipping_channels' => ['nullable', 'array'],
            'shipping_channels.standard' => ['boolean'],
            'shipping_channels.express' => ['boolean'],
            'shipping_channels.cod' => ['boolean'],
        ];
    }
}
