<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Order\SubmitReview;
use App\Http\Requests\Account\CreateReviewRequest;
use App\Http\Requests\Account\ShowReviewRequest;
use App\Models\OrderItem;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ReviewController
{
    public function create(ShowReviewRequest $request, OrderItem $orderItem): Response
    {
        $orderItem->load(['product.images', 'order', 'review']);

        return Inertia::render('account/review', [
            'orderItem' => $orderItem,
        ]);
    }

    public function store(CreateReviewRequest $request, OrderItem $orderItem, SubmitReview $action): RedirectResponse
    {
        $action->handle(
            $request->user(),
            $orderItem,
            $request->integer('rating'),
            $request->string('body')->toString() ?: null,
            $request->boolean('anonymous'),
            $request->file('photos') ?? [],
        );

        return redirect()
            ->route('orders.show', $orderItem->order_id)
            ->with('success', 'Review submitted. Thank you!');
    }
}
