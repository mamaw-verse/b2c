<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListShopsRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'halal_only' => ['sometimes', 'boolean'],
            'sort' => ['sometimes', 'in:followers,rating,newest'],
        ];
    }

    public function queryText(): string
    {
        return $this->validated('q', '');
    }

    public function halalOnly(): bool
    {
        return $this->boolean('halal_only');
    }

    public function sort(): string
    {
        return $this->validated('sort', 'followers');
    }
}
