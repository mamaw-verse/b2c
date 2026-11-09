<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\SuspendUser;
use App\Actions\Admin\UnsuspendUser;
use App\Http\Requests\Admin\CreateUserSuspensionRequest;
use App\Http\Requests\Admin\DeleteUserSuspensionRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class UserSuspensionController
{
    public function store(CreateUserSuspensionRequest $request, User $user, SuspendUser $action): RedirectResponse
    {
        $action->handle($user, $request->user(), $request->ip());

        return redirect()->route('admin.users.show', $user)->with('success', 'User suspended.');
    }

    public function destroy(DeleteUserSuspensionRequest $request, User $user, UnsuspendUser $action): RedirectResponse
    {
        $action->handle($user, $request->user(), $request->ip());

        return redirect()->route('admin.users.show', $user)->with('success', 'Suspension lifted.');
    }
}
