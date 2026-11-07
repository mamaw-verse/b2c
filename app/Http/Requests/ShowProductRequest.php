<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowProductRequest extends FormRequest
{
    public function authorize(): Response
    {
        $product = $this->route('product');
        assert($product instanceof Product);

        return $product->published && $product->halal_status->visibleToBuyers()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array{} */
    public function rules(): array
    {
        return [];
    }
}
