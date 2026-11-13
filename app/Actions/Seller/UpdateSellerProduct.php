<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Actions\Moderation\FlagListingKeywords;
use App\Enums\HalalStatus;
use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final readonly class UpdateSellerProduct
{
    public function __construct(private FlagListingKeywords $flagListingKeywords) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Product $product, array $data): Product
    {
        $product = $this->updateProduct($product, $data);
        $this->flagListingKeywords->handle($product);

        return $product;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function updateProduct(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $isHalalCertified = ($data['halal_status'] ?? '') === 'certified';

            // Calculate stock and price (form submits pesos; storage is centavos)
            $hasVariations = isset($data['variations']) && is_array($data['variations']);
            $stock = isset($data['stock']) ? (int) $data['stock'] : $product->stock;
            $price = $product->price;
            $wasPrice = $product->was_price;

            if (! empty($data['sale_price'])) {
                $price = (int) round(((float) $data['sale_price']) * 100);
                $wasPrice = (int) round(((float) ($data['price'] ?? 0)) * 100);
            } elseif (array_key_exists('price', $data)) {
                $price = (int) round(((float) ($data['price'] ?? 0)) * 100);
                $wasPrice = array_key_exists('was_price', $data) ? ($data['was_price'] ? (int) round(((float) $data['was_price']) * 100) : null) : null;
            }

            if ($hasVariations) {
                $stock = collect($data['variations'])->sum(fn ($v) => (int) ($v['stock'] ?? 0));
            }

            $updateData = [
                'name' => $data['name'] ?? $product->name,
                'category_id' => $data['category_id'] ?? $product->category_id,
                'description' => $data['description'] ?? $product->description,
                'price' => $price,
                'was_price' => $wasPrice,
                'stock' => $stock,
                'free_shipping' => isset($data['free_shipping']) ? (bool) $data['free_shipping'] : $product->free_shipping,
                'frozen' => isset($data['frozen']) ? (bool) $data['frozen'] : $product->frozen,
                'option1_name' => $data['option1_name'] ?? $product->option1_name,
                'option2_name' => $data['option2_name'] ?? $product->option2_name,
                'ingredients' => $data['ingredients'] ?? $product->ingredients,
                'no_pork_alcohol_declared' => isset($data['no_pork_alcohol_declared']) ? (bool) $data['no_pork_alcohol_declared'] : $product->no_pork_alcohol_declared,
                'weight' => isset($data['weight']) ? (float) $data['weight'] : $product->weight,
                'length' => isset($data['length']) ? (float) $data['length'] : $product->length,
                'width' => isset($data['width']) ? (float) $data['width'] : $product->width,
                'height' => isset($data['height']) ? (float) $data['height'] : $product->height,
            ];

            if (isset($data['published'])) {
                $updateData['published'] = (bool) $data['published'];
            }

            if (isset($data['halal_status'])) {
                $updateData['halal_status'] = match ($data['halal_status']) {
                    'certified' => HalalStatus::Review,
                    'not_ingestible', 'na' => HalalStatus::NotApplicable,
                    default => $product->halal_status,
                };
            }

            $product->update($updateData);

            // Update or create certification
            if ($isHalalCertified && ! empty($data['certifying_body'])) {
                $cert = $product->halalCertifications()->latest('valid_until')->first();
                if ($cert) {
                    $cert->update([
                        'certifying_body' => $data['certifying_body'],
                        'number' => $data['certificate_number'] ?? $cert->number,
                        'valid_until' => $data['valid_until'] ?? $cert->valid_until,
                        'document_path' => $data['document_path'] ?? $cert->document_path,
                    ]);
                } else {
                    $product->halalCertifications()->create([
                        'certifying_body' => $data['certifying_body'],
                        'number' => $data['certificate_number'] ?? 'PENDING',
                        'scope' => 'Product certification',
                        'valid_until' => $data['valid_until'] ?? now()->addYear(),
                        'document_path' => $data['document_path'] ?? null,
                    ]);
                }
            }

            // Replace variations if provided
            if ($hasVariations) {
                $product->variations()->delete();
                $savedVariations = [];
                foreach ($data['variations'] as $i => $v) {
                    if (! empty($v['sale_price'])) {
                        $vPrice = (int) round(((float) $v['sale_price']) * 100);
                        $vWasPrice = (int) round(((float) ($v['price'] ?? 0)) * 100);
                    } else {
                        $vPrice = isset($v['price']) ? (int) round(((float) $v['price']) * 100) : $price;
                        $vWasPrice = ! empty($v['was_price']) ? (int) round(((float) $v['was_price']) * 100) : null;
                    }

                    $product->variations()->create([
                        'option1_value' => (string) ($v['option1_value'] ?? 'Default'),
                        'option2_value' => ! empty($v['option2_value']) ? (string) $v['option2_value'] : null,
                        'price' => $vPrice,
                        'was_price' => $vWasPrice,
                        'stock' => isset($v['stock']) ? (int) $v['stock'] : 0,
                        'sku' => $v['sku'] ?? null,
                        'sort_order' => $i,
                    ]);
                    $savedVariations[] = ['price' => $vPrice, 'was_price' => $vWasPrice];
                }

                $cheapest = collect($savedVariations)->sortBy('price')->first();
                if ($cheapest) {
                    $product->update([
                        'price' => $cheapest['price'],
                        'was_price' => $cheapest['was_price'],
                    ]);
                }
            }

            // Media / images sync
            if (array_key_exists('keep_image_ids', $data) || ! empty($data['images'])) {
                $keepIds = $data['keep_image_ids'] ?? [];
                if (array_key_exists('keep_image_ids', $data)) {
                    $removedImages = $product->images()->whereNotIn('id', $keepIds)->get();
                    foreach ($removedImages as $removed) {
                        if (! empty($removed->url) && str_contains($removed->url, 'product-images/')) {
                            $relativePath = 'product-images/'.Str::after($removed->url, 'product-images/');
                            Storage::disk('public')->delete($relativePath);
                        }
                        $removed->delete();
                    }
                }

                $sortOrder = 0;
                $kept = $product->images()->whereIn('id', $keepIds)->orderBy('sort_order')->get();
                foreach ($kept as $keptImage) {
                    $keptImage->update(['sort_order' => $sortOrder++]);
                }

                $files = $data['images'] ?? [];
                if (! empty($files) && is_array($files)) {
                    foreach (array_values($files) as $file) {
                        if ($file instanceof UploadedFile) {
                            $path = $file->store('product-images', 'public');
                            if ($path === false) {
                                continue;
                            }

                            $product->images()->create([
                                'url' => Storage::disk('public')->url($path),
                                'icon' => 'package',
                                'sort_order' => $sortOrder++,
                            ]);
                        } elseif (is_array($file)) {
                            $product->images()->create([
                                'url' => $file['url'] ?? '',
                                'icon' => $file['icon'] ?? 'package',
                                'sort_order' => $sortOrder++,
                            ]);
                        } elseif (is_string($file)) {
                            $product->images()->create([
                                'url' => $file,
                                'icon' => 'package',
                                'sort_order' => $sortOrder++,
                            ]);
                        }
                    }
                }

                if ($product->images()->count() === 0) {
                    $product->images()->create([
                        'url' => '',
                        'icon' => 'package',
                        'sort_order' => 0,
                    ]);
                }
            }

            if ($product->halal_status === HalalStatus::Review) {
                $hasPendingHalal = ModerationQueueItem::query()
                    ->where('target_type', $product->getMorphClass())
                    ->where('target_id', $product->id)
                    ->where('type', ModerationItemType::Halal->value)
                    ->whereIn('state', [ModerationState::Pending->value, ModerationState::Flagged->value])
                    ->exists();

                if (! $hasPendingHalal) {
                    ModerationQueueItem::create([
                        'target_type' => $product->getMorphClass(),
                        'target_id' => $product->id,
                        'type' => ModerationItemType::Halal->value,
                        'state' => ModerationState::Pending->value,
                        'reason_code' => 'halal_review',
                        'flagged_by_type' => (new User)->getMorphClass(),
                        'flagged_by_id' => $product->shop->user_id,
                    ]);
                }
            }

            return $product;
        });
    }
}
