<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Blog schema (docs/planning/15-blog.md §5.1). All keys are ULIDs to match
 * users, products and categories. The `users.role` column is a plain string,
 * so the `editor` role (Phase 1) needs no schema change here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_categories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 80);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_system')->default(false);
            $table->foreignUlid('shop_category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('blog_images', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('uploaded_by_id')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->string('purpose', 16);
            $table->string('disk', 20);
            $table->string('original_path');
            $table->json('variants');
            $table->unsignedSmallInteger('width');
            $table->unsignedSmallInteger('height');
            $table->unsignedInteger('bytes');
            $table->string('mime');
            $table->string('alt', 200)->nullable();
            $table->string('caption', 200)->nullable();
            $table->timestamps();
        });

        Schema::create('blog_authors', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('display_name', 80);
            $table->string('slug', 100)->unique();
            $table->string('job_title', 80)->nullable();
            $table->string('bio', 600)->nullable();
            $table->foreignUlid('avatar_image_id')->nullable()->constrained('blog_images')->nullOnDelete();
            $table->json('links')->nullable();
            $table->boolean('is_house')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('consent_confirmed_at')->nullable();
            $table->foreignUlid('consent_confirmed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('consent_version', 16)->nullable();
            $table->timestamps();
        });

        Schema::create('blog_posts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('blog_category_id')->constrained('blog_categories')->restrictOnDelete();
            $table->foreignUlid('blog_author_id')->constrained('blog_authors')->restrictOnDelete();
            $table->foreignUlid('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 160);
            $table->string('slug', 160)->unique();
            $table->string('excerpt', 300);
            $table->longText('body_markdown');
            $table->longText('body_html');
            $table->json('toc')->nullable();
            $table->unsignedInteger('word_count')->default(0);
            $table->unsignedTinyInteger('reading_minutes')->default(1);
            $table->foreignUlid('cover_image_id')->nullable()->constrained('blog_images')->nullOnDelete();
            $table->foreignUlid('thumbnail_image_id')->nullable()->constrained('blog_images')->nullOnDelete();
            $table->json('faqs')->nullable();
            $table->string('status', 16)->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('view_count')->default(0);
            $table->string('seo_title', 70)->nullable();
            $table->string('seo_description', 170)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index(['blog_category_id', 'status', 'published_at']);
            $table->index(['blog_author_id', 'status', 'published_at']);
            $table->index(['is_featured', 'status', 'published_at']);
        });

        Schema::create('blog_tags', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 60);
            $table->string('slug', 80)->unique();
            $table->timestamps();
        });

        Schema::create('blog_post_tag', function (Blueprint $table) {
            $table->foreignUlid('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->foreignUlid('blog_tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $table->primary(['blog_post_id', 'blog_tag_id']);
        });

        Schema::create('blog_post_products', function (Blueprint $table) {
            $table->foreignUlid('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->foreignUlid('product_id')->index()->constrained('products')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->primary(['blog_post_id', 'product_id']);
        });

        Schema::create('blog_post_images', function (Blueprint $table) {
            $table->foreignUlid('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->foreignUlid('blog_image_id')->index()->constrained('blog_images')->cascadeOnDelete();
            $table->primary(['blog_post_id', 'blog_image_id']);
        });

        Schema::create('blog_post_slug_histories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('blog_post_id')->index()->constrained('blog_posts')->cascadeOnDelete();
            $table->string('slug', 160)->unique();
            $table->timestamps();
        });

        Schema::create('blog_editor_invitations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('email');
            $table->foreignUlid('invited_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });

        // One pending invitation per email (case-insensitive). Partial/expression
        // indexes are supported by SQLite and PostgreSQL.
        if (in_array(DB::getDriverName(), ['sqlite', 'pgsql'], true)) {
            DB::statement(
                'CREATE UNIQUE INDEX blog_editor_invitations_pending_email_unique '
                .'ON blog_editor_invitations (lower(email)) '
                .'WHERE accepted_at IS NULL AND revoked_at IS NULL'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_editor_invitations');
        Schema::dropIfExists('blog_post_slug_histories');
        Schema::dropIfExists('blog_post_images');
        Schema::dropIfExists('blog_post_products');
        Schema::dropIfExists('blog_post_tag');
        Schema::dropIfExists('blog_tags');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('blog_authors');
        Schema::dropIfExists('blog_images');
        Schema::dropIfExists('blog_categories');
    }
};
