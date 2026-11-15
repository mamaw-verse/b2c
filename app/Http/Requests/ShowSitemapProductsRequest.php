<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowSitemapProductsRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    public function pageNumber(): int
    {
        $raw = $this->route('page');

        return is_numeric($raw) ? max(1, (int) $raw) : 1;
    }
}
