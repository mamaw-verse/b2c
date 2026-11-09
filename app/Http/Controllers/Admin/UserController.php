<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\ListAdminUsers;
use App\Actions\Admin\ShowAdminUser;
use App\Http\Requests\Admin\ListAdminUsersRequest;
use App\Http\Requests\Admin\ShowAdminUserRequest;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

final class UserController
{
    public function index(ListAdminUsersRequest $request, ListAdminUsers $action): Response
    {
        return Inertia::render('admin/users/index', $action->handle(
            $request->string('q')->toString() ?: null,
            $request->string('role')->toString() ?: null,
            $request->suspended(),
        ));
    }

    public function show(ShowAdminUserRequest $request, User $user, ShowAdminUser $action): Response
    {
        return Inertia::render('admin/users/show', $action->handle($user));
    }
}
