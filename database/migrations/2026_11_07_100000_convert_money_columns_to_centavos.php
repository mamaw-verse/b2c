<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Money is stored as integer centavos everywhere (products already are).
     * Multiply existing decimal-peso values by 100, then change column types.
     */
    public function up(): void
    {
        foreach (['subtotal', 'shipping_fee', 'shipping_discount', 'voucher_discount', 'platform_voucher_discount', 'total', 'cod_fee'] as $column) {
            DB::table('orders')->update([$column => DB::raw("{$column} * 100")]);
        }

        foreach (['unit_price', 'subtotal'] as $column) {
            DB::table('order_items')->update([$column => DB::raw("{$column} * 100")]);
        }

        DB::table('shipping_options')->update(['fee' => DB::raw('fee * 100')]);
        DB::table('payments')->update(['amount' => DB::raw('amount * 100')]);

        // discount_value is a percentage for percent vouchers; only fixed
        // discounts carry a money amount.
        DB::table('vouchers')->where('discount_type', 'fixed')->update(['discount_value' => DB::raw('discount_value * 100')]);
        DB::table('vouchers')->update(['min_spend' => DB::raw('min_spend * 100')]);
        DB::table('vouchers')->whereNotNull('max_discount')->update(['max_discount' => DB::raw('max_discount * 100')]);

        Schema::table('orders', function (Blueprint $table) {
            foreach (['subtotal', 'shipping_fee', 'shipping_discount', 'voucher_discount', 'platform_voucher_discount', 'total', 'cod_fee'] as $column) {
                $table->unsignedInteger($column)->default(0)->change();
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedInteger('unit_price')->change();
            $table->unsignedInteger('subtotal')->change();
        });

        Schema::table('shipping_options', function (Blueprint $table) {
            $table->unsignedInteger('fee')->default(0)->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedInteger('amount')->change();
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedInteger('discount_value')->change();
            $table->unsignedInteger('max_discount')->nullable()->change();
            $table->unsignedInteger('min_spend')->default(0)->change();
        });
    }
};
