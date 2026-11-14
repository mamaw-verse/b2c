<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use App\Support\Settings;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreatePayoutRequest extends FormRequest
{
    public function __construct(private readonly Settings $settings)
    {
        parent::__construct();
    }

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
        $shop = $this->user()->shop;

        return [
            'amount' => ['required', 'integer', 'min:'.$this->settings->marketplaceInt('payouts.minimum')],
            'payout_account' => [function (string $attribute, mixed $value, Closure $fail) use ($shop): void {
                if (! $shop->payout_method || ! $shop->payout_account_name || ! $shop->payout_account_number) {
                    $fail('Add your payout account before requesting a payout.');
                }
            }],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['payout_account' => 'check']);
    }
}
