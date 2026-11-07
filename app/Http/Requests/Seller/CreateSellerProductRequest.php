<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateSellerProductRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'category_id' => ['required', 'string', 'exists:categories,id'],
            'description' => ['required', 'string', 'max:3000'],
            'price' => ['required_without:variations', 'nullable', 'numeric', 'min:1'],
            'was_price' => ['nullable', 'numeric', 'gt:price'],
            'stock' => ['required_without:variations', 'nullable', 'integer', 'min:0'],
            'halal_status' => ['required', 'string', 'in:certified,not_ingestible,na'],
            'certifying_body' => ['required_if:halal_status,certified', 'nullable', 'string', 'max:255'],
            'certificate_number' => ['required_if:halal_status,certified', 'nullable', 'string', 'max:100'],
            'valid_until' => ['required_if:halal_status,certified', 'nullable', 'date'],
            'ingredients' => ['required_if:halal_status,certified', 'nullable', 'string', 'max:2000'],
            'no_pork_alcohol_declared' => ['accepted_if:halal_status,certified', 'boolean'],
            'document_path' => ['nullable', 'string', 'max:255'],
            'weight' => ['required', 'numeric', 'min:0.01'],
            'length' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'frozen' => ['boolean'],
            'free_shipping' => ['boolean'],
            'published' => ['boolean'],
            'option1_name' => ['nullable', 'string', 'max:50'],
            'option2_name' => ['nullable', 'string', 'max:50'],
            'variations' => ['nullable', 'array'],
            'variations.*.option1_value' => ['required_with:variations', 'string', 'max:50'],
            'variations.*.option2_value' => ['nullable', 'string', 'max:50'],
            'variations.*.price' => ['required_with:variations', 'numeric', 'min:1'],
            'variations.*.stock' => ['required_with:variations', 'integer', 'min:0'],
            'variations.*.sku' => ['nullable', 'string', 'max:50'],
            'images' => ['nullable', 'array'],
        ];
    }
}
