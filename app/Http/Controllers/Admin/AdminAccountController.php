<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateAdminUser;
use App\Actions\Admin\RevokeAdminAccess;
use App\Http\Requests\Admin\CreateAdminAccountRequest;
use App\Http\Requests\Admin\DeleteAdminAccountRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

final class AdminAccountController implements HasMiddleware
{
    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('throttle:10,1', only: ['store']),
        ];
    }

    public function store(CreateAdminAccountRequest $request, CreateAdminUser $action): RedirectResponse
    {
        $admin = $request->user();
        assert($admin instanceof User);

        $action->handle(
            email: (string) $request->input('email'),
            name: $request->input('name') ? (string) $request->input('name') : null,
            admin: $admin,
            ip: $request->ip(),
            confirmPromote: $request->boolean('confirm_promote'),
        );

        return back()->with('success', 'Admin access granted.');
    }

    public function destroy(DeleteAdminAccountRequest $request, User $admin, RevokeAdminAccess $action): RedirectResponse
    {
        $actor = $request->user();
        assert($actor instanceof User);

        $action->handle(
            target: $admin,
            admin: $actor,
            ip: $request->ip(),
        );

        return back()->with('success', 'Admin access revoked.');
    }
}
