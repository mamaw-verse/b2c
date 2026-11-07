<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Address;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateAddressRequest extends FormRequest
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

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'phone' => ['sometimes', 'string', 'regex:/^\+639\d{9}$/'],
            'region_code' => ['sometimes', 'string', 'exists:regions,code'],
            'province_code' => ['sometimes', 'string', 'exists:provinces,code'],
            'city_code' => ['sometimes', 'string', 'exists:cities,code'],
            'barangay_code' => ['sometimes', 'string', 'exists:barangays,code'],
            'street' => ['sometimes', 'string', 'max:255'],
            'postal_code' => ['sometimes', 'string', 'size:4'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'label' => ['sometimes', 'string', 'in:home,work,other'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $raw = preg_replace('/[^0-9+]/', '', (string) $this->input('phone')) ?? '';
            if (str_starts_with($raw, '09')) {
                $raw = '+63'.mb_substr($raw, 1);
            } elseif (str_starts_with($raw, '9') && mb_strlen($raw) === 10) {
                $raw = '+63'.$raw;
            }
            $this->merge(['phone' => $raw]);
        }
    }
}
