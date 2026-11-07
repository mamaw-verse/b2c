<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Address;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateAddressDefaultRequest extends FormRequest
{
    public function authorize(): Response
    {
        $address = $this->route('address');
        if (! $address instanceof Address) {
            return Response::denyAsNotFound();
        }

        return $address->user_id === $this->user()?->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
