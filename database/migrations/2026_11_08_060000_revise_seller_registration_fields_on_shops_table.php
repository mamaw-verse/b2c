<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Columns added by the superseded 2026_11_08_054747 revision attempt.
        $superseded = [
            'business_type',
            'years_in_business',
            'product_categories',
            'halal_cert_body',
            'halal_cert_number',
            'halal_cert_expiry',
            'halal_cert_url',
            'trade_license_url',
        ];

        Schema::table('shops', function (Blueprint $table) use ($superseded) {
            foreach ($superseded as $column) {
                if (Schema::hasColumn('shops', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        // Registration no longer captures identity or payout details.
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn([
                'contact_number',
                'id_type',
                'id_number',
                'id_document_url',
                'selfie_url',
                'bank_name',
                'bank_account_name',
                'bank_account_number',
            ]);
        });

        // The 054747 migration dropped halal_only on some environments;
        // restore it where missing so schema is consistent everywhere.
        if (! Schema::hasColumn('shops', 'halal_only')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->boolean('halal_only')->default(false)->after('verification');
            });
        }

        Schema::table('shops', function (Blueprint $table) {
            $table->string('address_line')->nullable()->after('location');
            $table->string('city')->nullable()->after('address_line');
            $table->string('state')->nullable()->after('city');
            $table->string('postal_code', 10)->nullable()->after('state');
        });
    }
};
