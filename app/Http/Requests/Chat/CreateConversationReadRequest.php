<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\Enums\Workspace;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateConversationReadRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return Response::deny();
        }

        $conversation = $this->route('conversation');
        if (! $conversation instanceof Conversation) {
            return Response::denyAsNotFound();
        }

        $workspace = $this->routeIs('seller.*') ? Workspace::Seller : Workspace::Buyer;

        return $conversation->isParty($user, $workspace)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
