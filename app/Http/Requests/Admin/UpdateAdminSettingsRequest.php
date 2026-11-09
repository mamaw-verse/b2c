<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateAdminSettingsRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'auto_confirm_days' => ['required', 'integer', 'min:0', 'max:90'],
            'return_window_days' => ['required', 'integer', 'min:0', 'max:90'],
            'payout_hold_days' => ['required', 'integer', 'min:0', 'max:90'],
            'payout_minimum' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'announcement' => ['nullable', 'string', 'max:200'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function settingsPayload(): array
    {
        return [
            'commission_bps' => (int) round((float) $this->input('commission_rate') * 100),
            'auto_confirm_days' => $this->integer('auto_confirm_days'),
            'return_window_days' => $this->integer('return_window_days'),
            'payout_hold_days' => $this->integer('payout_hold_days'),
            'payout_minimum' => (int) round((float) $this->input('payout_minimum') * 100),
            'announcement' => $this->string('announcement')->toString() !== ''
                ? $this->string('announcement')->toString()
                : null,
        ];
    }
}
