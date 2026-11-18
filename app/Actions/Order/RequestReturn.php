<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\User;
use App\Notifications\SellerReturnRequestedNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

final readonly class RequestReturn
{
    /**
     * @param  array<int, array{order_item_id: string, qty: int}>  $items
     * @param  array<int, UploadedFile>  $photos
     */
    public function handle(User $user, Order $order, string $reason, array $items = [], array $photos = [], ?UploadedFile $video = null): void
    {
        if ($order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order' => 'Order not found.']);
        }

        if (! $order->status->isReturnable()) {
            throw ValidationException::withMessages(['order' => 'This order is not eligible for return/refund.']);
        }

        $photoPaths = array_values(array_map(
            fn (UploadedFile $file) => $file->store('return-proofs/photos', 'public'),
            $photos,
        ));

        $videoPath = $video instanceof UploadedFile
            ? $video->store('return-proofs/videos', 'public')
            : null;

        DB::transaction(function () use ($order, $reason, $items, $photoPaths, $videoPath): void {
            $order->update(['status' => OrderStatus::ReturnRefund]);

            OrderEvent::create([
                'order_id' => $order->id,
                'title' => 'Return/refund requested',
                'detail' => $reason,
                'metadata' => [
                    'items' => $items,
                    'photos' => $photoPaths,
                    'video' => $videoPath,
                ],
            ]);

            DB::afterCommit(fn () => Notification::send(
                $order->shop->operators(),
                new SellerReturnRequestedNotification($order, $reason),
            ));
        });
    }
}
