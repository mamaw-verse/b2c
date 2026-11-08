<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
final class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function configure(): static
    {
        return $this->afterMaking(function (Product $product) {
            // Products ship from their shop unless a location is set explicitly.
            $product->location ??= $product->shop->location;
        });
    }

    public function definition(): array
    {
        $name = fake()->randomElement([
            'Halal corned beef 340g, easy-open can',
            'Muslim-friendly chicken siopao, dozen pack',
            'Instant beef rendang paste 200g',
            'Wild honey from Palawan, 500ml jar',
            'Black seed oil, cold-pressed 100ml',
            'Crispy fried anchovies, spicy 150g',
            'Halal marshmallows, vanilla 200g',
            'Prayer beads, tasbih olive wood 99',
            'Abaya everyday wear, breathable crepe',
            'Quran journaling notebook, dotted A5',
            'Halal gelatin powder, unflavoured 250g',
            'Zamzam-inspired bottled water 500ml, 12-pack',
            'Dates energy bars, no added sugar',
            'Kabsa spice blend, family pack 80g',
            'Miswak natural toothbrush sticks, 5-pack',
            'Henna cone, organic body-art 25g',
        ]);
        $price = fake()->numberBetween(9900, 250000);

        return [
            'shop_id' => Shop::factory(),
            'category_id' => Category::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'description' => 'Packed fresh and quality-checked by the seller before shipping.',
            'price' => $price,
            'was_price' => null,
            'sold_count' => 0,
            'free_shipping' => false,
            'frozen' => false,
            'halal_status' => 'na',
            'stock' => 50,
            'published' => true,
        ];
    }

    public function certified(): static
    {
        return $this->state(['halal_status' => 'certified']);
    }
}
