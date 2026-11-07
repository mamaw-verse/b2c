<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Actions\Moderation\FlagListingKeywords;
use App\Enums\HalalStatus;
use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class CreateSellerProduct
{
    public function __construct(private FlagListingKeywords $flagListingKeywords) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Shop $shop, array $data): Product
    {
        $product = $this->createProduct($shop, $data);
        $this->flagListingKeywords->handle($product);

        return $product;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function createProduct(Shop $shop, array $data): Product
    {
        return DB::transaction(function () use ($shop, $data) {
            $isHalalCertified = ($data['halal_status'] ?? '') === 'certified';

            // Determine initial halal status
            $halalStatus = match ($data['halal_status'] ?? '') {
                'certified' => HalalStatus::Review, // Needs moderation before buyer-visible 'certified'
                'not_ingestible', 'na' => HalalStatus::NotApplicable,
                default => HalalStatus::NotApplicable,
            };

            $published = (bool) ($data['published'] ?? true);
            $hasVariations = ! empty($data['variations']) && is_array($data['variations']);

            // Calculate overall stock & base price (form submits pesos; storage is centavos)
            $stock = (int) ($data['stock'] ?? 0);
            $price = (int) round(((float) ($data['price'] ?? 0)) * 100);

            if ($hasVariations) {
                $stock = collect($data['variations'])->sum(fn ($v) => (int) ($v['stock'] ?? 0));
                $firstPrice = collect($data['variations'])->first()['price'] ?? null;
                if ($firstPrice !== null) {
                    $price = (int) round(((float) $firstPrice) * 100);
                }
            }

            $slug = Str::slug((string) $data['name']).'-'.mb_strtolower(Str::random(6));

            $product = $shop->products()->create([
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'price' => $price,
                'was_price' => ! empty($data['was_price']) ? (int) round(((float) $data['was_price']) * 100) : null,
                'location' => $shop->location,
                'free_shipping' => (bool) ($data['free_shipping'] ?? false),
                'frozen' => (bool) ($data['frozen'] ?? false),
                'halal_status' => $halalStatus,
                'stock' => $stock,
                'option1_name' => $data['option1_name'] ?? null,
                'option2_name' => $data['option2_name'] ?? null,
                'published' => $published,
                'ingredients' => $data['ingredients'] ?? null,
                'no_pork_alcohol_declared' => (bool) ($data['no_pork_alcohol_declared'] ?? false),
                'weight' => ! empty($data['weight']) ? (float) $data['weight'] : null,
                'length' => ! empty($data['length']) ? (float) $data['length'] : null,
                'width' => ! empty($data['width']) ? (float) $data['width'] : null,
                'height' => ! empty($data['height']) ? (float) $data['height'] : null,
            ]);

            // Save Halal Certification if claiming certified
            if ($isHalalCertified && ! empty($data['certifying_body'])) {
                $product->halalCertifications()->create([
                    'certifying_body' => $data['certifying_body'],
                    'number' => $data['certificate_number'] ?? 'PENDING',
                    'scope' => $data['scope'] ?? 'Product certification',
                    'valid_until' => $data['valid_until'] ?? now()->addYear(),
                    'document_path' => $data['document_path'] ?? null,
                    'checked_at' => null, // Pending admin moderation
                ]);
            }

            // Save variations
            if ($hasVariations) {
                foreach ($data['variations'] as $i => $v) {
                    $product->variations()->create([
                        'option1_value' => (string) ($v['option1_value'] ?? 'Default'),
                        'option2_value' => ! empty($v['option2_value']) ? (string) $v['option2_value'] : null,
                        'price' => isset($v['price']) ? (int) round(((float) $v['price']) * 100) : $price,
                        'stock' => isset($v['stock']) ? (int) $v['stock'] : 0,
                        'sku' => $v['sku'] ?? null,
                        'sort_order' => $i,
                    ]);
                }
            }

            // Save media / images
            if (! empty($data['images']) && is_array($data['images'])) {
                foreach ($data['images'] as $i => $img) {
                    $product->images()->create([
                        'url' => is_array($img) ? ($img['url'] ?? '') : (string) $img,
                        'icon' => is_array($img) ? ($img['icon'] ?? 'package') : 'package',
                        'sort_order' => $i,
                    ]);
                }
            } else {
                // Default product image icon
                $product->images()->create([
                    'url' => '',
                    'icon' => 'package',
                    'sort_order' => 0,
                ]);
            }

            if ($product->halal_status === HalalStatus::Review) {
                ModerationQueueItem::create([
                    'target_type' => $product->getMorphClass(),
                    'target_id' => $product->id,
                    'type' => ModerationItemType::Halal->value,
                    'state' => ModerationState::Pending->value,
                    'reason_code' => 'halal_review',
                    'flagged_by_type' => (new User)->getMorphClass(),
                    'flagged_by_id' => $shop->user_id,
                ]);
            }

            return $product;
        });
    }
}
