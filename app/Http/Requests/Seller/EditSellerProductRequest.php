<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class EditSellerProductRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $product = $this->route('product');
        assert($product instanceof Product);

        return ($user->isSeller() && $user->shop && $product->shop_id === $user->shop->id)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
