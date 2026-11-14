<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateSellerProductRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $product = $this->route('product');
        assert($product instanceof Product);

        $operatedShop = $user->operatedShop();

        return ($operatedShop !== null && $product->shop_id === $operatedShop->id)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'category_id' => ['sometimes', 'required', 'string', 'exists:categories,id'],
            'description' => ['sometimes', 'required', 'string', 'max:3000'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:1'],
            'sale_price' => ['nullable', 'numeric', 'min:1', 'lt:price'],
            'was_price' => ['nullable', 'numeric'],
            'stock' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'halal_status' => ['sometimes', 'required', 'string', 'in:certified,not_ingestible,na'],
            'certifying_body' => ['required_if:halal_status,certified', 'nullable', 'string', 'max:255'],
            'certificate_number' => ['required_if:halal_status,certified', 'nullable', 'string', 'max:100'],
            'valid_until' => ['required_if:halal_status,certified', 'nullable', 'date'],
            'ingredients' => ['required_if:halal_status,certified', 'nullable', 'string', 'max:2000'],
            'no_pork_alcohol_declared' => ['accepted_if:halal_status,certified', 'boolean'],
            'document_path' => ['nullable', 'string', 'max:255'],
            'weight' => ['sometimes', 'required', 'numeric', 'min:0.01'],
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
            'variations.*.sale_price' => ['nullable', 'numeric', 'min:1', 'lt:variations.*.price'],
            'variations.*.was_price' => ['nullable', 'numeric'],
            'variations.*.stock' => ['required_with:variations', 'integer', 'min:0'],
            'variations.*.sku' => ['nullable', 'string', 'max:50'],
            'images' => ['nullable', 'array', 'max:9'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'keep_image_ids' => ['nullable', 'array'],
            'keep_image_ids.*' => ['string'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm', 'max:30720'],
            'video_duration' => ['nullable', 'integer', 'min:1', 'max:60'],
            'remove_video' => ['nullable', 'boolean'],
        ];

        $user = $this->user();
        assert($user instanceof User);

        $affiliateRules = ! $user->ownsShop()
            ? [
                'affiliate_enabled' => ['prohibited'],
                'affiliate_commission_percent' => ['prohibited'],
            ]
            : [
                'affiliate_enabled' => ['sometimes', 'boolean'],
                'affiliate_commission_percent' => [
                    'nullable',
                    'required_if:affiliate_enabled,true,1',
                    'numeric',
                    'min:'.(((int) config('marketplace.affiliate.min_bps', 100)) / 100),
                    'max:'.(((int) config('marketplace.affiliate.max_bps', 3000)) / 100),
                ],
            ];

        return array_merge($rules, $affiliateRules);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('affiliate_enabled')) {
            $this->merge([
                'affiliate_enabled' => filter_var($this->input('affiliate_enabled'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        if ($this->has('remove_video')) {
            $remove = $this->input('remove_video');
            $this->merge([
                'remove_video' => ($remove === 'undefined' || $remove === null || $remove === '')
                    ? false
                    : filter_var($remove, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }
    }
}
