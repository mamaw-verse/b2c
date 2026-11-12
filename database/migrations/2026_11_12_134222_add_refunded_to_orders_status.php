<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;

/**
 * No-op on PostgreSQL (the status column is already varchar).
 * The new 'refunded' value is enforced at the application layer by OrderStatus.
 */
return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL stores the enum as varchar; no schema change required.
    }
};
