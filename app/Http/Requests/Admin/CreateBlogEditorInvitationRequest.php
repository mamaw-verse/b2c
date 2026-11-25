<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\BlogEditorInvitation;
use App\Models\User;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class CreateBlogEditorInvitationRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
        ];
    }

    public function email(): string
    {
        return mb_strtolower(mb_trim((string) $this->validated('email')));
    }

    /**
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $email = $this->email();

                $existing = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
                if ($existing !== null && $existing->canManageBlog()) {
                    $validator->errors()->add('email', 'This person is already an admin or editor.');

                    return;
                }

                // One open invitation per email (partial unique index): resend or revoke it instead.
                $open = BlogEditorInvitation::query()
                    ->whereRaw('LOWER(email) = ?', [$email])
                    ->whereNull('accepted_at')
                    ->whereNull('revoked_at')
                    ->exists();
                if ($open) {
                    $validator->errors()->add('email', 'This email already has an open invitation. Resend or revoke it.');

                    return;
                }

                $pending = BlogEditorInvitation::query()
                    ->whereNull('accepted_at')
                    ->whereNull('revoked_at')
                    ->where('expires_at', '>', now())
                    ->count();
                $max = (int) config('blog.editors.max_pending', 25);
                if ($pending >= $max) {
                    $validator->errors()->add('email', "There are already {$max} pending invitations. Revoke one first.");
                }
            },
        ];
    }
}
