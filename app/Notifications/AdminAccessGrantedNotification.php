<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class AdminAccessGrantedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $actionUrl,
        public bool $isNewAccount,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appName = (string) config('app.name');

        if ($this->isNewAccount) {
            $expire = (int) config('auth.passwords.users.expire', 60);

            return (new MailMessage)
                ->subject("Admin access granted on {$appName}")
                ->greeting('Hello!')
                ->line("You have been granted administrator access on {$appName}.")
                ->line('Please set a password for your account to get started.')
                ->action('Set Password', $this->actionUrl)
                ->line("This password reset link will expire in {$expire} minutes.")
                ->line('If the link expires, you can use "Forgot password" on the login screen to issue a new one.');
        }

        return (new MailMessage)
            ->subject("Admin access granted on {$appName}")
            ->greeting('Hello!')
            ->line("You have been granted administrator access on {$appName}.")
            ->line('You can now access the admin console using your existing account credentials.')
            ->action('Sign In', $this->actionUrl);
    }
}
