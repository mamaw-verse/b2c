<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Models\Voucher;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Shared voucher validation. Money inputs arrive in pesos and are converted
 * to centavos; percent discounts take a plain 1-100 value.
 */
trait ValidatesVoucher
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('code')) {
            $this->merge(['code' => mb_strtoupper($this->input('code'))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function voucherRules(?Voucher $ignore = null): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('vouchers', 'code')->ignore($ignore)],
            'discount_type' => ['required', Rule::in(['fixed', 'percent'])],
            'discount_value' => [
                'required', 'numeric',
                Rule::when(
                    $this->input('discount_type') === 'percent',
                    ['min:1', 'max:100'],
                    ['min:0.01', 'max:1000000'],
                ),
            ],
            'max_discount' => ['required_if:discount_type,percent', 'nullable', 'numeric', 'min:0.01', 'max:1000000'],
            'min_spend' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function voucherData(string $kind): array
    {
        $percent = $this->input('discount_type') === 'percent';

        return [
            'code' => $this->string('code')->toString(),
            'kind' => $kind,
            'discount_type' => $this->string('discount_type')->toString(),
            'discount_value' => $percent
                ? (int) $this->input('discount_value')
                : $this->pesosToCentavos($this->input('discount_value')),
            'max_discount' => $this->filled('max_discount')
                ? $this->pesosToCentavos($this->input('max_discount'))
                : null,
            'min_spend' => $this->pesosToCentavos($this->input('min_spend', 0)),
            'max_uses' => $this->filled('max_uses') ? $this->integer('max_uses') : null,
            'starts_at' => $this->filled('starts_at') ? Carbon::parse($this->input('starts_at'))->startOfDay() : null,
            'expires_at' => $this->filled('expires_at') ? Carbon::parse($this->input('expires_at'))->endOfDay() : null,
            'is_active' => $this->boolean('is_active'),
        ];
    }

    private function pesosToCentavos(mixed $pesos): int
    {
        return (int) round((float) $pesos * 100);
    }
}
