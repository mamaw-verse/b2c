<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListSellerProductsRequest extends FormRequest
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
            'status' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string'],
            'stock' => ['nullable', 'string', 'in:low'],
        ];
    }
}
