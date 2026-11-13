<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('products')
            ->whereNull('option1_name')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('product_variations')
                    ->whereColumn('product_variations.product_id', 'products.id');
            })
            ->update(['option1_name' => 'Option']);

        DB::table('products')
            ->whereNull('option2_name')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('product_variations')
                    ->whereColumn('product_variations.product_id', 'products.id')
                    ->whereNotNull('option2_value')
                    ->where('option2_value', '!=', '');
            })
            ->update(['option2_name' => 'Option 2']);
    }
};
