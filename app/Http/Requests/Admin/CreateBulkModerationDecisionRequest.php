<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ModerationQueueItem;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class CreateBulkModerationDecisionRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'ulid', 'exists:moderation_queue_items,id'],
            'action' => ['required', Rule::in(['approved', 'rejected', 'hidden', 'suspended'])],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $ids = $this->ids();
            if (empty($ids)) {
                return;
            }

            $states = ModerationQueueItem::whereIn('id', $ids)->pluck('state')->unique();
            if ($states->count() > 1) {
                $validator->errors()->add('ids', 'All selected items must be in the same state.');
            }
        });
    }

    /** @return list<string> */
    public function ids(): array
    {
        return $this->input('ids', []);
    }

    public function action(): string
    {
        return $this->string('action')->toString();
    }

    public function decisionReason(): string
    {
        return $this->string('reason')->toString();
    }
}
