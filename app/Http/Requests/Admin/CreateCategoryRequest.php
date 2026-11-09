<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class CreateCategoryRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories', 'slug')],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'icon' => ['required', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'requires_certification' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function categoryData(): array
    {
        return [
            'name' => $this->string('name')->toString(),
            'slug' => $this->filled('slug')
                ? $this->string('slug')->toString()
                : Str::slug($this->string('name')->toString()),
            'parent_id' => $this->input('parent_id') ?: null,
            'icon' => $this->string('icon')->toString(),
            'sort_order' => $this->integer('sort_order'),
            'commission_bps' => $this->commissionBps(),
            'requires_certification' => $this->boolean('requires_certification'),
        ];
    }

    public function commissionBps(): ?int
    {
        if (! $this->filled('commission_rate')) {
            return null;
        }

        return (int) round((float) $this->input('commission_rate') * 100);
    }
}
