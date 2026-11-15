<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use App\Notifications\AdminAccessGrantedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

final readonly class CreateAdminUser
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(string $email, ?string $name, User $admin, ?string $ip = null, bool $confirmPromote = false): User
    {
        return DB::transaction(function () use ($email, $name, $admin, $ip) {
            $normalizedEmail = mb_strtolower(mb_trim($email));
            $target = User::query()->where('email', $normalizedEmail)->first();

            if ($target === null) {
                $target = User::query()->create([
                    'name' => (string) $name,
                    'email' => $normalizedEmail,
                    'password' => Hash::make(Str::random(40)),
                    'role' => 'admin',
                    'email_verified_at' => now(),
                ]);

                $this->audit->handle($admin, 'admin.granted', $target, ['email' => $target->email], $ip);

                $token = Password::broker()->createToken($target);
                $actionUrl = route('password.reset', [
                    'token' => $token,
                    'email' => $target->email,
                ]);

                $target->notify(new AdminAccessGrantedNotification($actionUrl, isNewAccount: true));

                return $target;
            }

            $target->update(['role' => 'admin']);

            $this->audit->handle($admin, 'admin.granted', $target, ['email' => $target->email], $ip);

            $actionUrl = route('login');

            $target->notify(new AdminAccessGrantedNotification($actionUrl, isNewAccount: false));

            return $target;
        });
    }
}
