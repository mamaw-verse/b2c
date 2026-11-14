<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class ResolveOrderReturnRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::denyAsNotFound();
        }

        $order = $this->route('order');
        assert($order instanceof Order);

        $operatedShop = $user->operatedShop();

        if ($operatedShop === null || $operatedShop->suspended || $order->shop_id !== $operatedShop->id) {
            return Response::denyAsNotFound();
        }

        return $order->status === OrderStatus::ReturnRefund
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $order = $this->route('order');
        assert($order instanceof Order);

        return [
            'decision' => ['required', 'in:approve,reject'],
            'note' => ['required_if:decision,reject', 'nullable', 'string', 'max:500'],
            'items' => ['required_if:decision,approve', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'distinct', 'string', Rule::exists('order_items', 'id')->where('order_id', $order->id)],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ];
    }

    /** @return list<Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty() || $this->input('decision') !== 'approve') {
                return;
            }

            $order = $this->route('order');
            assert($order instanceof Order);
            $orderItems = $order->items()->with('refundItems')->get()->keyBy('id');

            foreach ($this->input('items', []) as $index => $line) {
                $item = $orderItems->get($line['order_item_id']);

                if ($item instanceof OrderItem && $line['qty'] > $item->qty - $item->refundedUnits()) {
                    $validator->errors()->add("items.{$index}.qty", 'Quantity exceeds the unrefunded amount.');
                }
            }
        }];
    }
}
