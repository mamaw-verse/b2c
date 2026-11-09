<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdatePayoutAccountRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        return $user->isSeller() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'payout_method' => ['required', 'string', 'max:50'],
            'payout_account_name' => ['required', 'string', 'max:100'],
            'payout_account_number' => ['required', 'string', 'max:100'],
        ];
    }
}
