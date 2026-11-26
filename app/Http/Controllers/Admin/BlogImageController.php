<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Blog\DeleteBlogImage;
use App\Actions\Blog\ListBlogImages;
use App\Actions\Blog\StoreBlogImage;
use App\Http\Requests\Admin\DeleteBlogImageRequest;
use App\Http\Requests\Admin\ListBlogImagesRequest;
use App\Http\Requests\Admin\StoreBlogImageRequest;
use App\Models\BlogImage;
use App\Models\User;
use App\Support\Blog\BlogImagePayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class BlogImageController
{
    public function index(ListBlogImagesRequest $request, ListBlogImages $action): JsonResponse
    {
        $page = $action->handle($request->user(), $request->purpose());

        return response()->json([
            'data' => $page->getCollection()->map(fn (BlogImage $image) => BlogImagePayload::from($image))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function store(StoreBlogImageRequest $request, StoreBlogImage $action): JsonResponse
    {
        $image = $action->handle(
            $request->user(),
            $request->imageFile(),
            $request->purpose(),
            $request->alt(),
            $request->caption(),
            $request->ip(),
        );

        return response()->json(['data' => BlogImagePayload::from($image)], 201);
    }

    public function destroy(DeleteBlogImageRequest $request, BlogImage $blogImage, DeleteBlogImage $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($blogImage, $user, $request->ip());

        return response()->noContent();
    }
}
