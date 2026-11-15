<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

final readonly class GetProductShareBreakdown
{
    /**
     * @return array{
     *     total: int,
     *     recent: int,
     *     by_channel: array<string, array{all: int, recent: int}>
     * }
     */
    public function handle(Product $product, int $days = 30): array
    {
        $allTime = DB::table('product_share_stats')
            ->where('product_id', $product->id)
            ->groupBy('channel')
            ->select('channel', DB::raw('SUM(count) as total'))
            ->pluck('total', 'channel')
            ->all();

        $cutoff = today()->subDays($days)->toDateString();

        $recent = DB::table('product_share_stats')
            ->where('product_id', $product->id)
            ->where('shared_on', '>=', $cutoff)
            ->groupBy('channel')
            ->select('channel', DB::raw('SUM(count) as total'))
            ->pluck('total', 'channel')
            ->all();

        /** @var array<string> $channels */
        $channels = (array) config('marketplace.share.channels', ['copy', 'facebook', 'messenger', 'x', 'native']);
        $allChannels = array_values(array_unique(array_merge($channels, array_keys($allTime), array_keys($recent))));

        $byChannel = [];
        foreach ($allChannels as $channel) {
            $byChannel[$channel] = [
                'all' => (int) ($allTime[$channel] ?? 0),
                'recent' => (int) ($recent[$channel] ?? 0),
            ];
        }

        return [
            'total' => (int) array_sum($allTime),
            'recent' => (int) array_sum($recent),
            'by_channel' => $byChannel,
        ];
    }
}
