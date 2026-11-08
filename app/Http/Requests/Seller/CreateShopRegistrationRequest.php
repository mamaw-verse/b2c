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
            'shop_name' => ['required', 'string', 'max:120', Rule::unique('shops', 'name')->ignore($this->user()->shop)],
            'description' => ['required', 'string', 'max:1000'],
            'location' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'halal_only' => ['boolean'],
            'id_type' => ['required', 'string', 'in:philsys,drivers_license,passport,national_id'],
            'id_number' => ['required', 'string', 'max:50'],
            'id_document' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            'selfie' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            'business_permit' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'bank_account_name' => ['required', 'string', 'max:120'],
            'bank_account_number' => ['required', 'string', 'max:50'],
            'bank_name' => ['required', 'string', 'max:120'],
            'agreed_to_terms' => ['accepted'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function applicationData(): array
    {
        return array_merge(
            $this->only([
                'shop_name', 'description', 'location', 'contact_number', 'halal_only',
                'id_type', 'id_number', 'bank_account_name', 'bank_account_number',
                'bank_name',
            ]),
            [
                'id_document' => $this->file('id_document'),
                'selfie' => $this->file('selfie'),
                'business_permit' => $this->file('business_permit'),
            ],
        );
    }
}
