<?php

declare(strict_types=1);

namespace App\Actions\Fortify;

use App\Actions\Seller\AcceptShopStaffInvitation;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\ShopStaffStatus;
use App\Models\BlogEditorInvitation;
use App\Models\ShopStaff;
use App\Models\User;
use App\Rules\TurnstileRule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

final readonly class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(
        private AcceptShopStaffInvitation $acceptStaffInvitation
    ) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'invitation' => ['nullable', 'string'],
            'cf-turnstile-response' => TurnstileRule::rules(),
        ], [
            'cf-turnstile-response.required' => __('Please complete the security check.'),
        ])->validate();

        $invitationId = $input['invitation'] ?? session()->get('staff_invitation_id');
        $invitation = null;

        if (is_string($invitationId) && $invitationId !== '') {
            $invitation = ShopStaff::query()
                ->where('id', $invitationId)
                ->where('status', ShopStaffStatus::Pending)
                ->whereRaw('LOWER(email) = ?', [mb_strtolower($input['email'])])
                ->first();

            if ($invitation !== null && $invitation->invited_at !== null && $invitation->invited_at->lt(now()->subDays(7))) {
                throw ValidationException::withMessages([
                    'email' => 'This invitation has expired.',
                ]);
            }
        }

        // A blog editor invitation link proves ownership of the invited address the same way.
        $editorInvitation = null;
        $editorInvitationId = session()->get('editor_invitation_id');
        if (is_string($editorInvitationId) && $editorInvitationId !== '') {
            $candidate = BlogEditorInvitation::query()->find($editorInvitationId);
            if ($candidate !== null && $candidate->isPending() && mb_strtolower($candidate->email) === mb_strtolower($input['email'])) {
                $editorInvitation = $candidate;
            }
        }

        return DB::transaction(function () use ($input, $invitation, $editorInvitation): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'email_verified_at' => $invitation !== null || $editorInvitation !== null ? now() : null,
            ]);

            if ($invitation !== null) {
                $this->acceptStaffInvitation->handle($invitation, $user, request()->ip());
                session()->forget('staff_invitation_id');
                session()->flash('success', "Welcome to the {$invitation->shop->name} team!");
            }

            if ($editorInvitation !== null) {
                session()->forget('editor_invitation_id');
            }

            return $user;
        });
    }
}
