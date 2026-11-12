<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Enums\ShopStatus;
use App\Models\ModerationQueueItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final readonly class SubmitShopApplication
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $user, array $data): Shop
    {
        $attributes = [
            'name' => $data['shop_name'],
            'slug' => Str::slug((string) $data['shop_name']).'-'.mb_strtolower(Str::random(6)),
            'location' => $data['city'],
            'address_line' => $data['address_line'],
            'city' => $data['city'],
            'state' => $data['state'],
            'postal_code' => $data['postal_code'],
            'description' => $data['description'],
            'logo_url' => isset($data['logo']) ? $this->storeDocument($data['logo']) : $user->shop?->logo_url,
            'halal_only' => (bool) ($data['halal_only'] ?? false),
            'business_permit_url' => $this->storeDocument($data['business_permit']),
            'status' => ShopStatus::Pending,
            'agreed_to_terms' => true,
            'terms_version' => config('marketplace.seller_terms.version'),
            'terms_accepted_at' => now(),
            'submitted_at' => now(),
            'rejection_reason' => null,
            'reviewed_at' => null,
            'reviewed_by' => null,
        ];

        return DB::transaction(function () use ($user, $data, $attributes) {
            $shop = $user->shop;

            if ($shop !== null) {
                // Re-application after rejection: resubmit in place, keep the slug stable.
                unset($attributes['slug']);
                $shop->update($attributes);
                $shop->halalCertifications()->delete();
            } else {
                $shop = $user->shop()->create($attributes);
            }

            foreach ($data['certificates'] as $certificate) {
                $shop->halalCertifications()->create([
                    'certifying_body' => $certificate['certifying_body'],
                    'number' => $certificate['certificate_number'],
                    'valid_until' => $certificate['valid_until'],
                    'document_path' => $certificate['document']->store('shop-documents/certificates', 'public'),
                ]);
            }

            ModerationQueueItem::query()
                ->where('target_type', $shop->getMorphClass())
                ->where('target_id', $shop->id)
                ->where('type', ModerationItemType::ShopApplication)
                ->whereIn('state', [ModerationState::Pending, ModerationState::Flagged])
                ->first()
                ?->update([
                    'state' => ModerationState::Pending,
                    'reason_code' => null,
                    'decision_reason' => null,
                ])
                ?? ModerationQueueItem::create([
                    'target_type' => $shop->getMorphClass(),
                    'target_id' => $shop->id,
                    'type' => ModerationItemType::ShopApplication,
                    'state' => ModerationState::Pending,
                    'flagged_by_type' => $user->getMorphClass(),
                    'flagged_by_id' => $user->id,
                ]);

            return $shop;
        });
    }

    private function storeDocument(UploadedFile $file): string
    {
        $path = $file->store('shop-documents', 'public');

        return Storage::disk('public')->url((string) $path);
    }
}
