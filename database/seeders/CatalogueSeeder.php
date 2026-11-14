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
                'email_verified_at' => now(),
            ]
        );

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

        $certify = function (Product $product, string $body, ?string $validUntil = null): void {
            HalalCertification::create([
                'certifiable_type' => $product->getMorphClass(),
                'certifiable_id' => $product->id,
                'certifying_body' => $body,
                'number' => 'HC-2026-'.fake()->numerify('#####'),
                'scope' => 'Product and packing facility, '.$product->location,
                'document_path' => '/images/compliance/cert-idcp-document.jpg',
                'valid_until' => $validUntil ?? now()->addYears(2),
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

        $travelMat = Product::where('slug', 'travel-prayer-mat-with-qibla-compass-and-pouch')->first();
        if ($travelMat) {
            $travelMat->update([
                'video_path' => 'product-videos/sample.mp4',
                'video_duration' => 2,
            ]);
        }

        // Authored catalogue depth: every name matches its category, photo and
        // shop; location always comes from the shop. Each product state the UI
        // renders (certified, review, expiring, expired, missing, na, frozen,
        // out of stock, discounted, long name, no reviews, no variations,
        // one/many images) is reachable.
        // name, price, was, rating, sold, icon, free shipping, halal, certifier, frozen, stock, category, shop, image_url
        $depth = [
            ['Instant beef rendang paste 200g', 18900, null, 4.7, 2400, 'utensils', false, 'certified', 'IDCP', false, 30, 'Halal Food', $barakah, '/images/catalogue/prod-rendang-paste.jpg'],
            ['Wild honey from Palawan, 500ml jar', 62000, 75000, 4.8, 890, 'droplets', true, 'certified', 'IDCP', false, 25, 'Halal Food', $barakah, '/images/catalogue/prod-wild-honey.jpg'],
            ['Black seed oil, cold-pressed 100ml', 44500, null, 4.6, 1500, 'droplets', false, 'certified', 'MinHA', false, 20, 'Health & Beauty', $barakah, '/images/catalogue/prod-blackseed-oil.jpg'],
            ['Crispy fried anchovies, spicy 150g', 17500, null, 4.5, 3200, 'utensils', false, 'certified', 'IDCP', false, 40, 'Halal Food', $barakah, '/images/catalogue/prod-crispy-anchovies.jpg'],
            ['Halal whole chicken, frozen 1.2kg', 31000, null, 4.8, 5600, 'beef', false, 'certified', 'HDIP', true, 35, 'Meat & Seafood', $meats, '/images/catalogue/prod-halal-chicken.jpg'],
            ['Halal nail polish, breathable 10ml', 24900, null, 4.4, 700, 'droplets', true, 'na', null, false, 45, 'Health & Beauty', $barakah, '/images/catalogue/prod-halal-nailpolish.jpg'],
            ['Frozen beef burger patties, 8-pack 800g', 42000, 49000, 4.7, 2100, 'beef', false, 'certified', 'HDIP', true, 0, 'Meat & Seafood', $meats, '/images/catalogue/prod-halal-chicken.jpg'],
            ['Kabsa spice blend, family pack 80g', 9500, null, 4.6, 1800, 'utensils', false, 'certified', 'IDCP', false, 60, 'Halal Food', $barakah, '/images/catalogue/prod-rendang-paste.jpg'],
            ['Halal marshmallows, vanilla 200g', 12900, null, 4.5, 940, 'candy', true, 'certified', 'IDCP', false, 50, 'Dates & Sweets', $barakah, '/images/catalogue/prod-wild-honey.jpg'],
            ['Halal gelatin powder, unflavoured 250g', 21500, null, 4.6, 620, 'candy', false, 'certified', 'IDCP', false, 38, 'Dates & Sweets', $barakah, '/images/catalogue/prod-wild-honey.jpg'],
            ['Prayer beads, tasbih olive wood 99', 15500, null, 0, 0, 'moon-star', false, 'na', null, false, 80, 'Prayer Essentials', $barakah, '/images/catalogue/prod-travel-prayer-mat.jpg'],
            ['Miswak natural toothbrush sticks, 5-pack', 8900, null, 4.3, 430, 'moon-star', false, 'na', null, false, 90, 'Prayer Essentials', $barakah, '/images/catalogue/prod-travel-prayer-mat.jpg'],
            ['Abaya everyday wear, breathable crepe, black', 189000, 229000, 4.8, 3100, 'shirt', true, 'na', null, false, 15, 'Modest Fashion', $barakah, '/images/catalogue/prod-chiffon-hijab.jpg'],
            ['Henna cone, organic body-art 25g', 6900, null, 4.4, 520, 'droplets', false, 'na', null, false, 70, 'Health & Beauty', $barakah, '/images/catalogue/prod-halal-nailpolish.jpg'],
            ['Quran journaling notebook, dotted A5', 32900, null, 4.7, 280, 'book-open', false, 'na', null, false, 33, 'Books & Quran', $barakah, '/images/catalogue/prod-quran-hardcover.jpg'],
            ['Muslim-friendly chicken siopao, dozen pack', 26500, null, 4.5, 1900, 'utensils', false, 'na', null, true, 44, 'Halal Food', $barakah, '/images/catalogue/prod-halal-chicken.jpg'],
            ['Zamzam-inspired bottled water 500ml, 12-pack', 35900, null, 4.6, 760, 'droplets', true, 'certified', 'IDCP', false, 55, 'Halal Food', $barakah, '/images/catalogue/prod-wild-honey.jpg'],
            ['Dates energy bars, no added sugar, box of 12', 29900, 35900, 4.5, 1300, 'candy', false, 'certified', 'IDCP', false, 48, 'Dates & Sweets', $barakah, '/images/catalogue/prod-ajwa-dates.jpg'],
            ['Halal corned beef 340g, easy-open can', 13900, null, 4.4, 4400, 'beef', false, 'certified', 'HDIP', false, 75, 'Meat & Seafood', $meats, '/images/catalogue/prod-beef-tapa.jpg'],
            ['Frozen lamb kebabs, marinated 600g', 48500, null, 4.7, 950, 'beef', false, 'certified', 'HDIP', true, 28, 'Meat & Seafood', $meats, '/images/catalogue/prod-beef-tapa.jpg'],
            ['Extra long product name fixture for layout testing — premium hand-poured prayer candle gift set with engraved keepsake box and ribbon', 58900, null, 0, 0, 'house', false, 'na', null, false, 12, 'Home & Living', $barakah, null],
            ['Bamboo prayer bead stand and tasbih holder, carved', 19900, null, 4.4, 210, 'house', false, 'na', null, false, 26, 'Home & Living', $barakah, null],
            ['Halal-certified chicken nuggets, frozen 1kg', 32900, null, 4.6, 2700, 'beef', false, 'certified', 'HDIP', true, 60, 'Meat & Seafood', $meats, '/images/catalogue/prod-halal-chicken.jpg'],
            ['Toddler prayer dress set, soft cotton 2-piece', 44900, null, 4.8, 190, 'smile', false, 'na', null, false, 22, 'Baby & Kids', $barakah, null],
            ['Muslim-friendly baby wipes, fragrance-free 80s', 9900, null, 4.5, 3800, 'smile', true, 'na', null, false, 90, 'Baby & Kids', $barakah, null],
            ['Gift voucher ₱500, spendable on any halal shop', 50000, null, 0, 0, 'ticket', false, 'na', null, false, 999, 'Vouchers', $barakah, null],
            ['Gift voucher ₱1000, Eid bundle card', 100000, null, 0, 0, 'ticket', false, 'na', null, false, 999, 'Vouchers', $barakah, null],
            ['Instant beef rendang paste 200g, mild', 18900, null, 4.6, 1100, 'utensils', false, 'review', null, false, 30, 'Halal Food', $barakah, '/images/catalogue/prod-rendang-paste.jpg'],
            ['Medjool dates 1kg box, soft and sweet', 115000, null, 4.9, 3400, 'candy', true, 'certified', 'IDCP', false, 18, 'Dates & Sweets', $barakah, '/images/catalogue/prod-ajwa-dates.jpg'],
            ['Sambal paste halal-certified 250g', 14900, null, 4.5, 880, 'utensils', false, 'certified', 'IDCP', false, 64, 'Halal Food', $barakah, '/images/catalogue/prod-rendang-paste.jpg'],
            ['Peanut brittle, halal-certified 200g', 11900, null, 4.4, 610, 'candy', false, 'certified', 'IDCP', false, 52, 'Dates & Sweets', $barakah, '/images/catalogue/prod-ajwa-dates.jpg'],
            ['Turmeric latte mix, halal-certified 150g', 18900, null, 4.3, 290, 'utensils', true, 'certified', 'IDCP', false, 41, 'Halal Food', $barakah, '/images/catalogue/prod-wild-honey.jpg'],
            ['Frozen chicken samosas, party pack 24pc', 38500, 45000, 4.6, 1600, 'beef', false, 'certified', 'HDIP', true, 34, 'Meat & Seafood', $meats, '/images/catalogue/prod-halal-chicken.jpg'],
        ];

        // Certificate states the detail page renders: expiring (valid < 30d),
        // and the product-level statuses buyers don't see in listings.
        $expiring = Product::create([
            'shop_id' => $meats->id,
            'category_id' => $byName['Meat & Seafood']->id,
            'name' => 'Halal duck liver pâté 180g',
            'slug' => 'halal-duck-liver-pate-180g',
            'description' => 'Packed fresh and quality-checked by '.$meats->name.'.',
            'price' => 44500,
            'rating' => 4.6,
            'sold_count' => 320,
            'location' => $meats->location,
            'halal_status' => 'expiring',
            'stock' => 16,
        ]);
        ProductImage::create(['product_id' => $expiring->id, 'icon' => 'beef']);
        $certify($expiring, 'Halal Development Institute of the Philippines (HDIP)', now()->addDays(20)->toDateString());

        foreach ([
            ['Halal chicken adobo flakes 150g', 'expired', 'halal-chicken-adobo-flakes-150g'],
            ['Muslim-owned kape barako beans 250g', 'missing', 'kape-barako-beans-250g'],
        ] as [$sname, $status, $sslug]) {
            $sp = Product::create([
                'shop_id' => $barakah->id,
                'category_id' => $byName['Halal Food']->id,
                'name' => $sname,
                'slug' => $sslug,
                'description' => 'Packed fresh and quality-checked by '.$barakah->name.'.',
                'price' => 16900,
                'rating' => 4.4,
                'sold_count' => 210,
                'location' => $barakah->location,
                'halal_status' => $status,
                'stock' => 22,
            ]);
            ProductImage::create(['product_id' => $sp->id, 'icon' => 'utensils']);
        }

        foreach ($depth as $i => [$name, $price, $was, $rating, $sold, $icon, $free, $halal, $body, $frozen, $stock, $cat, $shop, $imageUrl]) {
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $byName[$cat]->id,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => 'Packed fresh and quality-checked by '.$shop->name.'.',
                'price' => $price,
                'was_price' => $was,
                'rating' => $rating,
                'sold_count' => $sold,
                'location' => $shop->location,
                'free_shipping' => $free,
                'frozen' => $frozen,
                'halal_status' => $halal,
                'stock' => $stock,
            ]);
            ProductImage::create([
                'product_id' => $product->id,
                'url' => $imageUrl,
                'icon' => $icon,
            ]);
            if ($body) {
                $certify($product, match ($body) {
                    'IDCP' => 'Islamic Da’wah Council of the Philippines (IDCP)',
                    'HDIP' => 'Halal Development Institute of the Philippines (HDIP)',
                    default => 'Mindanao Halal Authority (MinHA)',
                });
            }
        }
    }
}
