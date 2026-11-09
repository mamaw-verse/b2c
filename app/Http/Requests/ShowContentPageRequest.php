<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowContentPageRequest extends FormRequest
{
    public function authorize(): Response
    {
        return config()->boolean("marketplace.pages.{$this->route('page')}.enabled", false)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * @return array<string, mixed>
     */
    public function page(): array
    {
        return config()->array("marketplace.pages.{$this->route('page')}");
    }
}
