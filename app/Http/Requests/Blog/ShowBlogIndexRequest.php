<?php

declare(strict_types=1);

namespace App\Http\Requests\Blog;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Query string for every paginated blog listing: `?page=` and, on the index, `?q=`.
 * Malformed values are normalised rather than rejected so a crawler never gets a 302/422.
 */
final class ShowBlogIndexRequest extends FormRequest
{
    public function authorize(): Response
    {
        return Response::allow();
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [];
    }

    public function pageNumber(): int
    {
        $page = $this->query('page', 1);

        return is_numeric($page) ? max(1, min(100_000, (int) $page)) : 1;
    }

    public function term(): ?string
    {
        $q = $this->query('q');
        if (! is_string($q)) {
            return null;
        }

        $q = mb_substr(mb_trim($q), 0, 100);

        return $q === '' ? null : $q;
    }
}
