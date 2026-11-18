<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller\Concerns;

/**
 * Validation rules and messages for per-variation shipping overrides and
 * the variation fields a seller can get wrong, shared by the create and
 * update product requests.
 */
trait HasProductVariationRules
{
    /**
     * A variation's shipping values are optional overrides: a blank value
     * means "use the product's default". They must be listed here, or
     * `validated()` drops them and the override is silently lost.
     *
     * @return array<string, array<int, string>>
     */
    protected function variationShippingRules(): array
    {
        return [
            'variations.*.weight' => ['nullable', 'numeric', 'min:0.01'],
            'variations.*.length' => ['nullable', 'numeric', 'min:0'],
            'variations.*.width' => ['nullable', 'numeric', 'min:0'],
            'variations.*.height' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'weight.required' => 'Enter the default weight in kg. Variations use it unless they set their own.',
            'weight.min' => 'The default weight must be at least 0.01 kg.',
            'variations.*.option1_value.required_with' => 'Variation :position needs a value for the first option.',
            'variations.*.price.required_with' => 'Variation :position needs a regular price.',
            'variations.*.price.min' => 'Variation :position: the regular price must be at least 1.',
            'variations.*.price.numeric' => 'Variation :position: the regular price must be a number.',
            'variations.*.sale_price.lt' => 'Variation :position: the sale price must be lower than the regular price.',
            'variations.*.sale_price.min' => 'Variation :position: the sale price must be at least 1.',
            'variations.*.stock.required_with' => 'Variation :position needs a stock quantity.',
            'variations.*.stock.min' => 'Variation :position: stock cannot be negative.',
            'variations.*.stock.integer' => 'Variation :position: stock must be a whole number.',
            'variations.*.weight.min' => 'Variation :position: the weight must be at least 0.01 kg.',
        ];
    }
}
