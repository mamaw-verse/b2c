<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use App\Support\Money;
use Illuminate\Database\Seeder;

final class ChatNotificationSeeder extends Seeder
{
    public function run(): void
    {
        /** @var User|null $user */
        $user = User::where('email', 'test@example.com')->first();
        if ($user === null) {
            return;
        }

        // 1. Barakah Pantry
        $barakah = Shop::firstOrCreate(
            ['slug' => 'barakah-pantry'],
            [
                'name' => 'Barakah Pantry',
                'location' => 'Cotabato City',
                'rating' => 4.9,
                'followers_count' => 1240,
                'chat_response_rate' => 98,
                'verification' => 'official',
                'halal_only' => true,
            ]
        );

        $ajwa = Product::where('shop_id', $barakah->id)->first();
        $order = Order::where('user_id', $user->id)->first();

        $c1 = Conversation::firstOrCreate(
            ['user_id' => $user->id, 'shop_id' => $barakah->id],
            ['last_message_at' => now()]
        );

        if ($ajwa !== null) {
            Message::firstOrCreate([
                'conversation_id' => $c1->id,
                'type' => MessageType::Product,
                'product_id' => $ajwa->id,
            ], [
                'sender_id' => $user->id,
                'sender_role' => MessageSenderRole::Buyer,
            ]);
        }

        Message::firstOrCreate([
            'conversation_id' => $c1->id,
            'body' => 'Hi! Available pa po ba ang Ajwa 500g?',
        ], [
            'sender_id' => $user->id,
            'sender_role' => MessageSenderRole::Buyer,
            'type' => MessageType::Text,
            'read_at' => now(),
        ]);

        Message::firstOrCreate([
            'conversation_id' => $c1->id,
            'body' => 'Yes po, available pa ang Ajwa. Ship today if you order before 3 PM!',
        ], [
            'sender_id' => $barakah->user_id,
            'sender_role' => MessageSenderRole::Seller,
            'type' => MessageType::Text,
            'read_at' => null,
        ]);

        if ($order !== null) {
            Message::firstOrCreate([
                'conversation_id' => $c1->id,
                'type' => MessageType::Order,
                'order_id' => $order->id,
            ], [
                'sender_id' => $barakah->user_id,
                'sender_role' => MessageSenderRole::Seller,
            ]);
        }

        Message::firstOrCreate([
            'conversation_id' => $c1->id,
            'body' => 'Salamat po!',
        ], [
            'sender_id' => $user->id,
            'sender_role' => MessageSenderRole::Buyer,
            'type' => MessageType::Text,
            'read_at' => null,
        ]);

        // 2. Mindanao Halal Meats
        $mindanao = Shop::firstOrCreate(
            ['slug' => 'mindanao-halal-meats'],
            [
                'name' => 'Mindanao Halal Meats',
                'location' => 'Davao City',
                'rating' => 4.8,
                'followers_count' => 850,
                'chat_response_rate' => 95,
                'halal_only' => true,
            ]
        );

        $c2 = Conversation::firstOrCreate(
            ['user_id' => $user->id, 'shop_id' => $mindanao->id],
            ['last_message_at' => now()->subDay()]
        );

        Message::firstOrCreate([
            'conversation_id' => $c2->id,
            'body' => 'Thank you for your order!',
        ], [
            'sender_id' => $mindanao->user_id,
            'sender_role' => MessageSenderRole::Seller,
            'type' => MessageType::Text,
            'read_at' => now()->subDay(),
        ]);

        // 3. Hijab House PH
        $hijab = Shop::firstOrCreate(
            ['slug' => 'hijab-house-ph'],
            [
                'name' => 'Hijab House PH',
                'location' => 'Zamboanga City',
                'rating' => 4.7,
                'followers_count' => 2100,
                'chat_response_rate' => 92,
                'halal_only' => true,
            ]
        );

        $c3 = Conversation::firstOrCreate(
            ['user_id' => $user->id, 'shop_id' => $hijab->id],
            ['last_message_at' => now()->subDays(2)]
        );

        Message::firstOrCreate([
            'conversation_id' => $c3->id,
            'body' => 'Welcome to Hijab House! Let us know if you need sizing help.',
        ], [
            'sender_id' => $hijab->user_id,
            'sender_role' => MessageSenderRole::Seller,
            'type' => MessageType::Text,
            'read_at' => now()->subDays(2),
        ]);

        // 4. Notifications for test user
        if ($order !== null && $user->notifications()->count() === 0) {
            $user->notify(new OrderStatusNotification(
                $order,
                'Parcel out for delivery',
                "Order #{$order->id} will arrive today. Prepare ".Money::format($order->total).' if paying by COD.'
            ));

            $user->notify(new OrderStatusNotification(
                $order,
                'Halal Pantry Fair vouchers are live',
                'Claim up to ₱300 off before they run out.'
            ));

            $user->notify(new OrderStatusNotification(
                $order,
                'Rate your purchase',
                'How were the Ajwa dates? Share a review.'
            ));
        }
    }
}
