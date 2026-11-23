<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Enums\HalalStatus;
use App\Models\HalalCertification;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Support\Schema\SchemaId;

/**
 * Builds the schema.org `Product` (or `ProductGroup` + `hasVariant` when the product has variations).
 *
 * Every value is something the product page also shows. Optional data that sellers do not
 * supply yet (GTIN, MPN, brand) is omitted rather than guessed.
 */
final readonly class BuildProductNode
{
    private const int DESCRIPTION_LIMIT = 5000;

    public function __construct(
        private BuildOfferNode $offers,
        private BuildReviewNodes $reviews,
    ) {}

    /**
     * @param  array<int, string>  $images  Absolute image URLs.
     * @param  array<string, mixed>|null  $seller  Shop Organization reference or stub.
     * @param  array<int, string>  $categoryPath  Category names, root first.
     * @return array<string, mixed>
     */
    public function handle(
        Product $product,
        string $canonical,
        array $images,
        string $fallbackDescription,
        ?array $seller,
        array $categoryPath,
        string $brandName,
    ): array {
        $hasVariants = $product->variations->isNotEmpty();
        $reviewData = $this->reviews->handle($product);

        $node = [
            '@type' => $hasVariants ? 'ProductGroup' : 'Product',
            '@id' => SchemaId::product($product->slug),
            'url' => $canonical,
            'name' => $product->name,
            'description' => $this->description($product) ?: $fallbackDescription,
            'image' => $images,
            'brand' => ['@type' => 'Brand', 'name' => $product->brand ?: $brandName],
            'category' => $categoryPath !== [] ? implode(' > ', $categoryPath) : null,
            'weight' => $this->weight($product->weight),
            'additionalProperty' => $this->additionalProperties($product),
            'hasCertification' => $this->certification($product->halalCertification),
        ];

        if ($product->gtin !== null && $product->gtin !== '') {
            $node['gtin'] = $product->gtin;
        }

        if ($product->country_of_origin !== null && $product->country_of_origin !== '') {
            $node['countryOfOrigin'] = ['@type' => 'Country', 'name' => $product->country_of_origin];
        }

        if ($hasVariants) {
            $node['productGroupID'] = (string) $product->id;
            $node['variesBy'] = $this->variesBy($product);
            $node['hasVariant'] = $product->variations
                ->map(fn (ProductVariation $variation): array => $this->variant($product, $variation, $canonical, $images, $seller))
                ->values()
                ->all();
        } else {
            $node['sku'] = (string) $product->id;
            $node['offers'] = $this->offers->handle(
                price: $product->price,
                wasPrice: $product->was_price,
                inStock: $product->stock > 0,
                url: $canonical,
                seller: $seller,
                freeShipping: $product->free_shipping,
            );
        }

        $node['aggregateRating'] = $reviewData['aggregateRating'];
        $node['review'] = $reviewData['review'];

        return $node;
    }

    private function description(Product $product): string
    {
        $plain = mb_trim(strip_tags((string) $product->description));
        $collapsed = preg_replace('/\s+/', ' ', $plain);

        return mb_substr(is_string($collapsed) ? mb_trim($collapsed) : '', 0, self::DESCRIPTION_LIMIT);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function weight(float|int|string|null $kilograms): ?array
    {
        if ($kilograms === null || (float) $kilograms <= 0) {
            return null;
        }

        return [
            '@type' => 'QuantitativeValue',
            'value' => (float) $kilograms,
            'unitCode' => 'KGM',
        ];
    }

    /**
     * Halal facts as PropertyValue entries. Certificate details are published only while the certificate is valid.
     *
     * @return array<int, array<string, mixed>>
     */
    private function additionalProperties(Product $product): array
    {
        $properties = [];

        $status = match ($product->halal_status) {
            HalalStatus::Certified, HalalStatus::Expiring => 'Halal-certified',
            HalalStatus::NotApplicable => 'Muslim-friendly',
            default => null,
        };

        if ($status !== null) {
            $properties[] = $this->property('Halal status', $status);
        }

        $certificate = $product->halalCertification;
        if ($status !== null && $this->isValid($certificate)) {
            $properties[] = $this->property('Halal certifying body', $certificate->certifying_body);
            $properties[] = $this->property('Halal certificate number', $certificate->number);
            $properties[] = $this->property('Halal certificate valid until', $certificate->valid_until->toDateString());
        }

        $ingredients = $product->ingredients !== null ? mb_trim(strip_tags($product->ingredients)) : '';
        if ($ingredients !== '') {
            $properties[] = $this->property('Ingredients', $ingredients);
        }

        $allergens = $product->allergens !== null ? mb_trim(strip_tags($product->allergens)) : '';
        if ($allergens !== '') {
            $properties[] = $this->property('Allergens', $allergens);
        }

        $storage = $product->storage_condition !== null ? mb_trim(strip_tags($product->storage_condition)) : '';
        if ($storage !== '') {
            $properties[] = $this->property('Storage condition', $storage);
        }

        $origin = $product->country_of_origin !== null ? mb_trim(strip_tags($product->country_of_origin)) : '';
        if ($origin !== '') {
            $properties[] = $this->property('Country of origin', $origin);
        }

        return $properties;
    }

    /**
     * @return array<string, mixed>
     */
    private function property(string $name, string $value): array
    {
        return ['@type' => 'PropertyValue', 'name' => $name, 'value' => $value];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function certification(?HalalCertification $certificate): ?array
    {
        if (! $this->isValid($certificate)) {
            return null;
        }

        return [
            '@type' => 'Certification',
            'name' => 'Halal certification',
            'issuedBy' => ['@type' => 'Organization', 'name' => $certificate->certifying_body],
            'certificationIdentification' => $certificate->number,
            'expires' => $certificate->valid_until->toDateString(),
        ];
    }

    /**
     * @phpstan-assert-if-true HalalCertification $certificate
     */
    private function isValid(?HalalCertification $certificate): bool
    {
        return $certificate !== null && ! $certificate->valid_until->isPast();
    }

    /**
     * @return array<int, string>
     */
    private function variesBy(Product $product): array
    {
        return array_values(array_filter(
            array_map(
                fn (?string $name): ?string => $this->variesByTerm($name),
                [$product->option1_name, $product->option2_name],
            ),
        ));
    }

    private function variesByTerm(?string $optionName): ?string
    {
        $name = mb_strtolower(mb_trim((string) $optionName));

        return match (true) {
            $name === '' => null,
            str_contains($name, 'colo') => 'https://schema.org/color',
            str_contains($name, 'size') => 'https://schema.org/size',
            default => mb_trim((string) $optionName),
        };
    }

    /**
     * @param  array<int, string>  $images
     * @param  array<string, mixed>|null  $seller
     * @return array<string, mixed>
     */
    private function variant(Product $product, ProductVariation $variation, string $canonical, array $images, ?array $seller): array
    {
        $label = $variation->option1_value.($variation->option2_value ? " / {$variation->option2_value}" : '');
        $url = "{$canonical}?variant={$variation->id}";

        $variant = [
            '@type' => 'Product',
            'name' => "{$product->name} ({$label})",
            'sku' => $variation->sku !== null && $variation->sku !== '' ? $variation->sku : "{$product->id}-{$variation->id}",
            'url' => $url,
            'image' => $images[0] ?? null,
            'weight' => $this->weight($variation->weight),
            'offers' => $this->offers->handle(
                price: $variation->price ?? $product->price,
                wasPrice: $variation->was_price ?? $product->was_price,
                inStock: $variation->stock > 0,
                url: $url,
                seller: $seller,
                freeShipping: $product->free_shipping,
            ),
        ];

        foreach ([[$product->option1_name, $variation->option1_value], [$product->option2_name, $variation->option2_value]] as [$optionName, $value]) {
            $term = $this->variesByTerm($optionName);
            if ($value === null || $value === '') {
                continue;
            }
            if ($term === 'https://schema.org/color') {
                $variant['color'] = $value;
            } elseif ($term === 'https://schema.org/size') {
                $variant['size'] = $value;
            }
        }

        return $variant;
    }
}
