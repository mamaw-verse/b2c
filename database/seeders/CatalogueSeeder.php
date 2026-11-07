<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\HalalCertification;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariation;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class CatalogueSeeder extends Seeder
{
    /**
     * Seed a realistic halal catalogue (sample data from the design system).
     * Certifier names are placeholders pending the NCMF accredited list.
     */
    public function run(): void
    {
        $categories = collect([
            ['Halal Food', 'utensils'],
            ['Meat & Seafood', 'beef'],
            ['Dates & Sweets', 'candy'],
            ['Modest Fashion', 'shirt'],
            ['Prayer Essentials', 'moon-star'],
            ['Books & Quran', 'book-open'],
            ['Health & Beauty', 'droplets'],
            ['Baby & Kids', 'smile'],
            ['Home & Living', 'house'],
            ['Vouchers', 'ticket'],
        ])->map(fn (array $c, int $i) => Category::create([
            'name' => $c[0],
            'slug' => Str::slug($c[0]),
            'icon' => $c[1],
            'sort_order' => $i,
        ]));

        $food = $categories->firstWhere('name', 'Halal Food');
        foreach (['Meat & Poultry', 'Frozen', 'Dates & Sweets', 'Pantry', 'Beverages', 'Snacks', 'Spices & Sauces'] as $i => $name) {
            Category::create([
                'parent_id' => $food->id,
                'name' => $name,
                'slug' => 'halal-food-'.Str::slug($name),
                'icon' => 'utensils',
                'sort_order' => $i,
            ]);
        }

        $seller = User::firstOrCreate(
            ['email' => 'seller@example.com'],
            [
                'name' => 'Barakah Pantry Owner',
                'password' => bcrypt('password'),
                'role' => 'seller',
                'email_verified_at' => now(),
            ]
        );
        $seller->update(['role' => 'seller']);

        $barakah = Shop::create([
            'user_id' => $seller->id,
            'name' => 'Barakah Pantry',
            'slug' => 'barakah-pantry',
            'location' => 'Cotabato City',
            'description' => 'Homemade kakanin from Quezon City. Fresh every morning since 2015.',
            'logo_url' => '/images/shops/shop-albarakah-logo.svg',
            'banner_url' => '/images/banners/shop-albarakah-banner.jpg',
            'rating' => 4.9,
            'followers_count' => 12800,
            'chat_response_rate' => 97,
            'verification' => 'official',
            'halal_only' => true,
            'vacation_mode' => false,
            'auto_reply' => true,
            'shipping_channels' => ['standard' => true, 'express' => true, 'cod' => true],
        ]);

        $meats = Shop::create([
            'name' => 'Mindanao Halal Meats',
            'slug' => 'mindanao-halal-meats',
            'location' => 'Davao City',
            'logo_url' => '/images/shops/shop-mindanao-meats-logo.svg',
            'banner_url' => '/images/banners/shop-mindanao-meats-banner.jpg',
            'rating' => 4.8,
            'followers_count' => 3400,
            'chat_response_rate' => 92,
        ]);

        $certify = function (Product $product, string $body): void {
            HalalCertification::create([
                'certifiable_type' => $product->getMorphClass(),
                'certifiable_id' => $product->id,
                'certifying_body' => $body,
                'number' => 'HC-2026-'.fake()->numerify('#####'),
                'scope' => 'Product and packing facility, '.$product->location,
                'document_path' => '/images/compliance/cert-idcp-document.jpg',
                'valid_until' => now()->addYears(2),
                'checked_at' => now()->subWeek(),
            ]);
        };

        $byName = $categories->keyBy('name');

        // name, price (centavos), was, rating, sold, loc, icon, free shipping, halal, certifier, frozen, category, shop, image_url
        $catalogue = [
            ['Ajwa dates 500g, premium grade, resealable tub', 64900, 79900, 4.9, 12400, 'Taguig', 'cookie', true, 'certified', 'IDCP', false, 'Dates & Sweets', $barakah, '/images/catalogue/prod-ajwa-dates.jpg'],
            ['Halal-certified chicken longganisa, frozen 500g', 23500, null, 4.8, 6200, 'Davao City', 'beef', false, 'certified', 'HDIP', true, 'Meat & Seafood', $meats, '/images/catalogue/prod-chicken-longganisa.jpg'],
            ['Instant chiffon hijab, 12 colours, no pins needed', 24900, 32900, 4.9, 25300, 'Manila', 'shirt', false, 'na', null, false, 'Modest Fashion', $barakah, '/images/catalogue/prod-chiffon-hijab.jpg'],
            ['Handwoven Maranao malong, hand-stitched tapestry', 185000, null, 4.8, 860, 'Marawi City', 'shopping-bag', true, 'na', null, false, 'Modest Fashion', $barakah, '/images/catalogue/prod-maranao-malong.jpg'],
            ['Halal-certified beef tapa 300g, vacuum pack', 28900, 34500, 4.7, 3200, 'Zamboanga City', 'beef', false, 'certified', 'MinHA', true, 'Meat & Seafood', $meats, '/images/catalogue/prod-beef-tapa.jpg'],
            ['Travel prayer mat with qibla compass and pouch', 34900, 59900, 4.7, 5100, 'Quezon City', 'moon-star', false, 'na', null, false, 'Prayer Essentials', $barakah, '/images/catalogue/prod-travel-prayer-mat.jpg'],
            ['Alcohol-free rosewater toner 100ml', 39500, null, 4.6, 1100, 'Cagayan de Oro', 'droplets', true, 'certified', 'MinHA', false, 'Health & Beauty', $barakah, '/images/catalogue/prod-rosewater-toner.jpg'],
            ['Qur’an with English translation, hardcover', 78000, null, 4.9, 410, 'Cotabato City', 'book-open', false, 'na', null, false, 'Books & Quran', $barakah, '/images/catalogue/prod-quran-hardcover.jpg'],
        ];

        foreach ($catalogue as [$name, $price, $was, $rating, $sold, $loc, $icon, $free, $halal, $body, $frozen, $cat, $shop, $imageUrl]) {
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $byName[$cat]->id,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => 'Soft, quality-checked and packed by '.$shop->name.'. Every halal claim is verified before listing.',
                'price' => $price,
                'was_price' => $was,
                'rating' => $rating,
                'sold_count' => $sold,
                'location' => $loc,
                'free_shipping' => $free,
                'frozen' => $frozen,
                'halal_status' => $halal,
                // One out-of-stock listing so the catalog shows the sold-out card state.
                'stock' => $cat === 'Meat & Seafood' && str_contains($name, 'tapa') ? 0 : 42,
            ]);

            $galleryImages = match ($name) {
                'Ajwa dates 500g, premium grade, resealable tub' => [
                    $imageUrl,
                    '/images/catalogue/pd-rendang-cooked-serving.jpg',
                    '/images/catalogue/pd-rendang-nutrition-cert.jpg',
                    '/images/catalogue/pd-rendang-spices-in-use.jpg',
                ],
                default => [$imageUrl, null, null, null],
            };

            collect(['package', 'shopping-bag', 'gift', 'tag'])->each(
                fn (string $ic, int $i) => ProductImage::create([
                    'product_id' => $product->id,
                    'url' => $galleryImages[$i] ?? null,
                    'icon' => $ic,
                    'sort_order' => $i,
                ]),
            );

            if ($body) {
                $certify($product, match ($body) {
                    'IDCP' => 'Islamic Da’wah Council of the Philippines (IDCP)',
                    'HDIP' => 'Halal Development Institute of the Philippines (HDIP)',
                    default => 'Mindanao Halal Authority (MinHA)',
                });
            }
        }

        // Variations on the flagship product.
        $ajwa = Product::where('slug', 'ajwa-dates-500g-premium-grade-resealable-tub')->firstOrFail();
        $ajwa->update(['option1_name' => 'Grade', 'option2_name' => 'Weight']);
        foreach ([
            ['Premium', '250g', 34900], ['Premium', '500g', 64900], ['Premium', '1kg', 119900],
            ['Standard', '250g', 28900], ['Standard', '500g', 52900], ['Standard', '1kg', 99900],
            ['Sukkari', '500g', null],
        ] as $i => [$grade, $weight, $vprice]) {
            ProductVariation::create([
                'product_id' => $ajwa->id,
                'option1_value' => $grade,
                'option2_value' => $weight,
                'price' => $vprice,
                'stock' => $vprice === null ? 0 : 20,
                'sort_order' => $i,
            ]);
        }

        // Filler products so grids, search and shops have depth.
        $fillerImages = [
            '/images/catalogue/prod-rendang-paste.jpg',
            '/images/catalogue/prod-wild-honey.jpg',
            '/images/catalogue/prod-blackseed-oil.jpg',
            '/images/catalogue/prod-crispy-anchovies.jpg',
            '/images/catalogue/prod-halal-chicken.jpg',
            '/images/catalogue/prod-halal-nailpolish.jpg',
        ];

        $tops = $categories->whereNull('parent_id');
        foreach (range(1, 40) as $i) {
            $shop = $i % 3 === 0 ? $meats : $barakah;
            $certified = $i % 4 === 0;
            $product = Product::factory()->create([
                'shop_id' => $shop->id,
                'category_id' => $tops->random()->id,
                'halal_status' => $certified ? 'certified' : 'na',
                'frozen' => $certified && $shop->is($meats) && $i % 8 === 0,
            ]);
            ProductImage::create([
                'product_id' => $product->id,
                'url' => $fillerImages[$i % count($fillerImages)],
                'icon' => 'package',
            ]);
            if ($certified) {
                $certify($product, 'Islamic Da’wah Council of the Philippines (IDCP)');
            }
        }
    }
}
