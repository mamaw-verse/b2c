<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListAddressRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user() !== null
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
