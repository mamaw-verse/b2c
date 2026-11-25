<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\RenderBlogBody;
use App\Http\Requests\Admin\CreateBlogMarkdownPreviewRequest;
use Illuminate\Http\JsonResponse;

final class BlogMarkdownPreviewController
{
    public function store(CreateBlogMarkdownPreviewRequest $request, RenderBlogBody $action): JsonResponse
    {
        $body = $action->handle($request->markdown());

        return response()->json([
            'html' => $body->html,
            'toc' => $body->toc,
            'word_count' => $body->wordCount,
            'reading_minutes' => $body->readingMinutes,
            'errors' => $body->errors,
            'warnings' => $body->warnings,
        ]);
    }
}
