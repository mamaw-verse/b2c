<?php

declare(strict_types=1);

use App\Actions\Moderation\FlagExpiringCertificates;
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

Schedule::command('moderation:flag-expiring-certificates')->dailyAt('03:00');
