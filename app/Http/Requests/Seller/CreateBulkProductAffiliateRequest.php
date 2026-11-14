<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateBulkProductAffiliateRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        return $user->ownsShop() && $user->shop?->isApproved()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $shop = $this->user()?->shop;

        return [
            'product_ids' => ['required', 'array', 'min:1'],
            'product_ids.*' => [
                'required',
                'string',
                Rule::exists('products', 'id')->where(function ($query) use ($shop) {
                    if ($shop !== null) {
                        $query->where('shop_id', $shop->id);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                }),
            ],
            'enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return list<string>
     */
    public function productIds(): array
    {
        /** @var list<string> */
        return $this->validated('product_ids');
    }

    public function enabled(): bool
    {
        return (bool) $this->validated('enabled');
    }
}
