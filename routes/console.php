<?php

declare(strict_types=1);

use App\Actions\Moderation\FlagExpiringCertificates;
use App\Actions\Order\AutoCompleteOrders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('moderation:flag-expiring-certificates', function () {
    $flagged = app(FlagExpiringCertificates::class)->handle();
    $this->info("Flagged {$flagged} expiring/expired certificate(s).");
})->purpose('Flag products/shops with expiring or expired Halal certificates');

Artisan::command('orders:auto-complete', function () {
    $completed = app(AutoCompleteOrders::class)->handle();
    $this->info("Auto-completed {$completed} order(s).");
})->purpose('Complete shipped orders the buyer never confirmed');

Schedule::command('orders:auto-complete')->dailyAt('03:30');
Schedule::command('moderation:flag-expiring-certificates')->dailyAt('03:00');
