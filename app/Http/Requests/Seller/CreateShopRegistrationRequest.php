<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Enums\ShopStatus;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateShopRegistrationRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $shop = $user->shop;

        return match (true) {
            $shop === null => Response::allow(),
            // A rejected application may be edited and resubmitted.
            $shop->status === ShopStatus::Rejected => Response::allow(),
            // GET shows the pending application's status; resubmission is not allowed.
            $shop->status === ShopStatus::Pending && ! $this->isMethod('post') => Response::allow(),
            default => Response::denyAsNotFound(),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        if (! $this->isMethod('post')) {
            return [];
        }

        return [
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'shop_name' => ['required', 'string', 'max:120', Rule::unique('shops', 'name')->ignore($this->user()->shop)],
            'description' => ['required', 'string', 'max:1000'],
            'address_line' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'state' => ['required', 'string', 'max:120'],
            'postal_code' => ['required', 'string', 'max:10'],
            'business_permit' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'certificates' => ['required', 'array', 'min:1'],
            'certificates.*.certifying_body' => ['required', 'string', 'max:255'],
            'certificates.*.certificate_number' => ['required', 'string', 'max:100'],
            'certificates.*.valid_until' => ['required', 'date', 'after_or_equal:today'],
            'certificates.*.document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'agreed_to_terms' => ['accepted'],
            'halal_only' => ['boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function applicationData(): array
    {
        return array_merge(
            $this->only([
                'shop_name', 'description', 'address_line', 'city', 'state',
                'postal_code', 'halal_only',
            ]),
            [
                'logo' => $this->file('logo'),
                'business_permit' => $this->file('business_permit'),
                'certificates' => $this->validated('certificates'),
            ],
        );
    }
}
