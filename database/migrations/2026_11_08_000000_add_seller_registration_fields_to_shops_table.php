<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('status')->default('approved')->after('suspended');
            $table->text('rejection_reason')->nullable()->after('status');
            $table->timestamp('submitted_at')->nullable()->after('rejection_reason');
            $table->timestamp('reviewed_at')->nullable()->after('submitted_at');
            $table->foreignUlid('reviewed_by')->nullable()
                ->index()->constrained('users')->nullOnDelete();
            $table->string('contact_number')->nullable()->after('reviewed_by');
            $table->string('id_type')->nullable()->after('contact_number');
            $table->string('id_number')->nullable()->after('id_type');
            $table->string('id_document_url')->nullable()->after('id_number');
            $table->string('selfie_url')->nullable()->after('id_document_url');
            $table->string('business_permit_url')->nullable()->after('selfie_url');
            $table->string('bank_account_name')->nullable()->after('business_permit_url');
            $table->string('bank_account_number')->nullable()->after('bank_account_name');
            $table->string('bank_name')->nullable()->after('bank_account_number');
            $table->boolean('agreed_to_terms')->default(false)->after('bank_name');
        });

        // Backfill existing shops to approved
        DB::table('shops')->whereNull('status')->orWhere('status', '')->update(['status' => 'approved']);

        // One shop per user
        DB::statement('CREATE UNIQUE INDEX shops_user_id_unique ON shops (user_id) WHERE user_id IS NOT NULL');
    }
};
