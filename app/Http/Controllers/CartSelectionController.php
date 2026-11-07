<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Cart\SelectCartItems;
use App\Http\Requests\UpdateCartSelectionRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class CartSelectionController
{
    public function update(UpdateCartSelectionRequest $request, SelectCartItems $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle(
            $user,
            (array) $request->input('item_ids'),
            (bool) $request->input('selected')
        );

        return back();
    }
}
