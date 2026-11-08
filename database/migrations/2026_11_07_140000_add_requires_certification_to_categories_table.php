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
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('requires_certification')->default(true);
        });

        $exempt = ['prayer-essentials', 'modest-fashion', 'books-quran'];

        DB::table('categories')
            ->whereIn('slug', $exempt)
            ->orWhereIn(
                'parent_id',
                DB::table('categories')->whereIn('slug', $exempt)->pluck('id'),
            )
            ->update(['requires_certification' => false]);
    }
};
