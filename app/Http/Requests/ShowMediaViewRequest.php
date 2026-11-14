<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\ShopStatus;
use App\Models\Media;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowMediaViewRequest extends FormRequest
{
    public function authorize(): Response
    {
        $media = $this->route('media');
        if (! $media instanceof Media) {
            $media = Media::find($media);
        }

        if (! $media instanceof Media) {
            return Response::denyAsNotFound();
        }

        if (str_starts_with($media->mime_type, 'video/')) {
            if (! (bool) config('marketplace.features.product_video_enabled')) {
                return Response::denyAsNotFound();
            }

            if ($media->scan_status !== 'clean') {
                return Response::denyAsNotFound();
            }
        }

        if ($this->isPublicMedia($media)) {
            return Response::allow();
        }

        $user = $this->user();
        if (! $user instanceof User) {
            return Response::deny();
        }

        if ($user->role === 'admin' || $media->uploaded_by_id === $user->id) {
            return Response::allow();
        }

        $isOperator = Product::query()
            ->where('video_media_id', $media->id)
            ->whereHas('shop', function ($query) use ($user): void {
                $query->where(function ($q) use ($user): void {
                    $q->where('user_id', $user->id)
                        ->orWhereHas('activeStaff', fn ($staffQuery) => $staffQuery->where('user_id', $user->id));
                });
            })
            ->exists();

        if ($isOperator) {
            return Response::allow();
        }

        return Response::deny();
    }

    public function isPublic(): bool
    {
        $media = $this->route('media');
        if (! $media instanceof Media) {
            $media = Media::find($media);
        }

        return $media instanceof Media && $this->isPublicMedia($media);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    private function isPublicMedia(Media $media): bool
    {
        if (str_starts_with($media->mime_type, 'video/')) {
            return (bool) config('marketplace.features.product_video_enabled')
                && $media->scan_status === 'clean'
                && Product::visible()
                    ->where('video_media_id', $media->id)
                    ->whereHas('shop', fn ($query) => $query->where('status', ShopStatus::Approved->value)->where('suspended', false))
                    ->exists();
        }

        return false;
    }
}
