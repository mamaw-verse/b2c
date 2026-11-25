<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Actions\Blog\ValidateBlogImageFile;
use App\Models\BlogImage;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class StoreBlogImageRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->canManageBlog() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => ['required', 'file'],
            'purpose' => ['required', Rule::in(BlogImage::PURPOSES)],
            'alt' => ['nullable', 'string', 'max:200'],
            'caption' => ['nullable', 'string', 'max:200'],
        ];
    }

    /**
     * Content checks (real mime, dimensions, animation, per-purpose minimums) run after the
     * basic rules so the 422 carries the same messages `StoreBlogImage` would throw.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $file = $this->file('image');
                if ($validator->errors()->isNotEmpty() || ! $file instanceof UploadedFile) {
                    return;
                }

                $problem = app(ValidateBlogImageFile::class)->handle($file, (string) $this->input('purpose'), $this->input('alt'));
                if ($problem !== null) {
                    $validator->errors()->add('image', $problem);
                }
            },
        ];
    }

    public function imageFile(): UploadedFile
    {
        /** @var UploadedFile */
        return $this->file('image');
    }

    public function purpose(): string
    {
        return (string) $this->validated('purpose');
    }

    public function alt(): ?string
    {
        return $this->validated('alt');
    }

    public function caption(): ?string
    {
        return $this->validated('caption');
    }
}
