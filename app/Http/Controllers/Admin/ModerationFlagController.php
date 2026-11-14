<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateModerationFlag;
use App\Http\Requests\Admin\CreateAdminProductFlagRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;

final class ModerationFlagController
{
    public function store(
        CreateAdminProductFlagRequest $request,
        CreateModerationFlag $action,
    ): RedirectResponse {
        $product = Product::findOrFail($request->productId());

        $item = $action->handle(
            $request->user(),
            $product,
            $request->flagReason(),
            $request->note(),
            $request->ip(),
        );

        return redirect()->route('admin.moderation.show', $item);
    }
}
