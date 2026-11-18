<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Editing a product that was created without photos used to keep its
     * empty placeholder image row next to the uploaded photos, so galleries
     * and catalog cards still showed the placeholder. Remove placeholder
     * rows from products that now have at least one real photo.
     */
    public function up(): void
    {
        DB::table('product_images')
            ->where('url', '')
            ->whereIn('product_id', function ($query): void {
                $query->select('product_id')
                    ->from('product_images')
                    ->where('url', '!=', '');
            })
            ->delete();
    }

    public function down(): void
    {
        // Deleted placeholder rows carried no data worth restoring.
    }
};
