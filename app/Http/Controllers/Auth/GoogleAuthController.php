<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\AbstractUser as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;
use UnexpectedValueException;

final class GoogleAuthController
{
    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            if (! $googleUser instanceof SocialiteUser) {
                throw new RuntimeException('Google returned an unsupported user response.');
            }

            if (! filled($googleUser->getId()) || ! $this->hasVerifiedEmail($googleUser)) {
                return $this->authenticationFailed(__('Google did not provide a verified identity and email address.'));
            }

            $user = DB::transaction(fn (): User => $this->resolveUser($googleUser));
        } catch (UnexpectedValueException) {
            return $this->authenticationFailed(__('This email address is already linked to another Google account.'));
        } catch (Throwable $exception) {
            report($exception);

            return $this->authenticationFailed(__('We could not sign you in with Google. Please try again.'));
        }

        if ($user->isSuspended()) {
            return $this->authenticationFailed(__('Your account has been suspended.'));
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Re-run Google OAuth for an already signed-in user so Google can act as
     * the identity-confirmation factor on the confirm-password screen.
     */
    public function confirmRedirect(Request $request): SymfonyRedirectResponse
    {
        return Socialite::driver('google')
            ->redirectUrl(route('auth.google.confirm.callback'))
            ->with([
                'login_hint' => $request->user()->email,
                'prompt' => 'login',
            ])
            ->redirect();
    }

    public function confirmCallback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('auth.google.confirm.callback'))
                ->user();
            $user = $request->user();

            if (! $googleUser instanceof SocialiteUser
                || ! filled($googleUser->getId())
                || ! $this->hasVerifiedEmail($googleUser)
                || ! filled($user->google_id)
                || ! hash_equals((string) $user->google_id, (string) $googleUser->getId())) {
                return $this->confirmationFailed(__('That Google account does not match your signed-in account.'));
            }
        } catch (Throwable $exception) {
            report($exception);

            return $this->confirmationFailed(__('We could not confirm your identity with Google. Please try again.'));
        }

        $request->session()->passwordConfirmed();

        return redirect()->intended(route('security.edit'));
    }

    private function hasVerifiedEmail(SocialiteUser $googleUser): bool
    {
        return filled($googleUser->getEmail())
            && data_get($googleUser->getRaw(), 'verified_email') === true;
    }

    private function resolveUser(SocialiteUser $googleUser): User
    {
        $googleId = (string) $googleUser->getId();
        $email = Str::lower(mb_trim((string) $googleUser->getEmail()));

        $user = User::query()->where('google_id', $googleId)->lockForUpdate()->first();

        if ($user !== null) {
            return $user;
        }

        $user = User::query()->where('email', $email)->lockForUpdate()->first();

        if ($user !== null) {
            if ($user->google_id !== null && $user->google_id !== $googleId) {
                throw new UnexpectedValueException('The email address is already linked to another Google account.');
            }

            $user->forceFill(['google_id' => $googleId])->save();

            return $user;
        }

        $user = new User([
            'name' => $this->resolveName($googleUser, $email),
            'email' => $email,
            'email_verified_at' => now(),
            'password' => null,
        ]);
        $user->forceFill(['google_id' => $googleId])->save();

        return $user;
    }

    private function resolveName(SocialiteUser $googleUser, string $email): string
    {
        $name = Str::of((string) $googleUser->getName())->squish()->toString();

        if ($name !== '') {
            return $name;
        }

        $given = mb_trim((string) data_get($googleUser->getRaw(), 'given_name'));
        $family = mb_trim((string) data_get($googleUser->getRaw(), 'family_name'));
        $joined = mb_trim($given.' '.$family);

        return $joined !== '' ? $joined : Str::before($email, '@');
    }

    private function authenticationFailed(string $message): RedirectResponse
    {
        return redirect()->route('login')->withErrors(['google' => $message]);
    }

    private function confirmationFailed(string $message): RedirectResponse
    {
        return redirect()->route('password.confirm')->withErrors(['google' => $message]);
    }
}
