<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateProductShareRequest extends FormRequest
{
    public function authorize(): Response
    {
        if (! config('marketplace.features.product_share_enabled', false)) {
            return Response::denyAsNotFound();
        }

        $product = $this->route('product');
        assert($product instanceof Product);

        return $product->published && $product->halal_status->visibleToBuyers()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var list<string> $channels */
        $channels = (array) config('marketplace.share.channels', []);

        return [
            'channel' => ['required', 'string', Rule::in($channels)],
        ];
    }

    public function channel(): string
    {
        return (string) $this->validated('channel');
    }

    public function fingerprint(): string
    {
        $user = $this->user();
        $identifier = $user !== null ? (string) $user->id : ($this->ip() ?? 'unknown');
        $userAgent = (string) $this->userAgent();

        return sha1($identifier.'|'.$userAgent);
    }
}
