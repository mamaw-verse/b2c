<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\BlogEditorInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class BlogEditorInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public BlogEditorInvitation $invitation) {}

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
        $days = (int) config('blog.editors.invitation_ttl_days', 7);

        return (new MailMessage)
            ->subject("You've been invited to write for the {$appName} blog")
            ->greeting('Hello!')
            ->line("You have been invited to write articles for the {$appName} blog as an editor.")
            ->line('Editors write and publish their own posts. Your name will be credited publicly as the author, so you will be asked to confirm that when you accept.')
            ->action('View invitation', route('editor-invitations.show', ['invitation' => $this->invitation->id]))
            ->line("This invitation link expires in {$days} days.")
            ->line('If you did not expect this invitation, you can ignore this email.');
    }
}
