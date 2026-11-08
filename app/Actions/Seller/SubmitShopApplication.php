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
            'location' => $data['location'],
            'description' => $data['description'],
            'halal_only' => (bool) ($data['halal_only'] ?? false),
            'status' => ShopStatus::Pending,
            'contact_number' => $data['contact_number'],
            'id_type' => $data['id_type'],
            'id_number' => $data['id_number'],
            'id_document_url' => $this->storeDocument($data['id_document']),
            'selfie_url' => $this->storeDocument($data['selfie']),
            'business_permit_url' => isset($data['business_permit']) ? $this->storeDocument($data['business_permit']) : null,
            'bank_account_name' => $data['bank_account_name'],
            'bank_account_number' => $data['bank_account_number'],
            'bank_name' => $data['bank_name'],
            'agreed_to_terms' => true,
            'submitted_at' => now(),
            'rejection_reason' => null,
            'reviewed_at' => null,
            'reviewed_by' => null,
        ];

        return DB::transaction(function () use ($user, $attributes) {
            $shop = $user->shop;

            if ($shop !== null) {
                // Re-application after rejection: resubmit in place, keep the slug stable.
                unset($attributes['slug']);
                $shop->update($attributes);
            } else {
                $shop = $user->shop()->create($attributes);
            }

            ModerationQueueItem::create([
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
