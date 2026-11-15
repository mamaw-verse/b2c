<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowSocialImageRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:product,shop,category'],
            'slug' => ['required', 'string'],
            'v' => ['nullable', 'string'],
        ];
    }

    public function type(): string
    {
        return (string) $this->route('type');
    }

    public function slug(): string
    {
        return (string) $this->route('slug');
    }

    public function version(): ?string
    {
        return $this->query('v') ? (string) $this->query('v') : null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'type' => $this->route('type'),
            'slug' => $this->route('slug'),
        ]);
    }
}
