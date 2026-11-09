<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('fulfillment_status')->default('unfulfilled')->after('status');
        });

        Schema::create('fulfillments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('order_id')->constrained()->cascadeOnDelete();
            $table->string('courier_name');
            $table->string('tracking_number');
            $table->string('tracking_url')->nullable();
            $table->string('status')->default('shipped');
            $table->timestamp('shipped_at');
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'shipped_at']);
        });

        Schema::create('fulfillment_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('fulfillment_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('order_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();
        });

        DB::table('orders')->whereIn('status', ['to_receive', 'completed', 'return_refund'])->orderBy('id')->each(function ($order) {
            $event = DB::table('order_events')->where('order_id', $order->id)->where('title', 'Parcel shipped')->orderBy('created_at')->first();

            if ($event === null) {
                return;
            }

            $metadata = json_decode((string) $event->metadata, true) ?: [];
            $fulfillmentId = (string) Str::ulid();

            DB::table('fulfillments')->insert([
                'id' => $fulfillmentId,
                'order_id' => $order->id,
                'courier_name' => $metadata['courier_name'] ?? 'Unknown',
                'tracking_number' => $metadata['tracking_number'] ?? 'N/A',
                'status' => $order->status === 'to_receive' ? 'shipped' : 'delivered',
                'shipped_at' => $event->created_at,
                'delivered_at' => $order->status === 'to_receive' ? null : $order->updated_at,
                'created_at' => $event->created_at,
                'updated_at' => $event->created_at,
            ]);

            DB::table('order_items')->where('order_id', $order->id)->get()->each(fn ($item) => DB::table('fulfillment_items')->insert([
                'id' => (string) Str::ulid(),
                'fulfillment_id' => $fulfillmentId,
                'order_item_id' => $item->id,
                'quantity' => $item->qty,
                'created_at' => $event->created_at,
                'updated_at' => $event->created_at,
            ]));

            DB::table('orders')->where('id', $order->id)->update(['fulfillment_status' => 'fulfilled']);
        });
    }
};
