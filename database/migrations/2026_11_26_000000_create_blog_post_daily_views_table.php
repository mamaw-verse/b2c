<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Per-day view counts for the 30-day popularity rail (docs/planning/15-blog.md B4.2).
 * `blog_posts.view_count` stays as the all-time total.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_post_daily_views', function (Blueprint $table) {
            $table->foreignUlid('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->date('day')->index();
            $table->unsignedInteger('views')->default(0);
            $table->primary(['blog_post_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_daily_views');
    }
};
