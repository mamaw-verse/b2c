# Controllers

- Controllers are CRUD by design. Their only public methods are `index`, `create`, `store`, `show`, `edit`, `update`, and `destroy`.
- Never add a custom method (`approve`, `pin`, `follow`, `export`, `markAsRead`). Instead, find the resource being created, updated, or deleted, and give it its own controller:
  - Approving a post → `PostApprovalController@store`. Rejecting it → `PostRejectionController@store`.
  - Pinning a post → `PostPinController@update`. Unpinning it → `PostPinController@destroy`.
  - Following a user → `UserFollowController@store`. Unfollowing → `UserFollowController@destroy`.
  - Approving the selected items in a moderation queue → `ModerationController@update`.
- When an endpoint really does not fit CRUD, use an invokable controller with a single `__invoke()` method, named after the thing, minimally: `ExportController`, not `PersonalDataExportController` or `ExportPersonalDataController`.
- Controller names are nouns, never verbs: `PostBookmarkController`, not `BookmarkPostController`.
- Controllers stay thin: resolve the form request, delegate to one class that holds the business logic (an action, service, or query object, following whatever the app already uses), and return a response.
- Controllers never authorize or validate anything: no `abort()`, `abort_if()`, `abort_unless()`, `throw_if()`, `throw_unless()`, `$request->validate()`, `$this->authorize()`, `Gate::authorize()`, `Validator::make()`, or `ValidationException`. Every check lives in the form request of that endpoint (`rules()` for validation, `authorize()` for authorization).
- Follow the existing conventions in the codebase (namespaces, `declare(strict_types=1)`, class modifiers) rather than introducing new ones.

@boostsnippet('Example controller', 'php')
<?php

namespace App\Http\Controllers;

use App\Actions\CreatePostBookmark;
use App\Actions\DeletePostBookmark;
use App\Http\Requests\CreatePostBookmarkRequest;
use App\Http\Requests\DeletePostBookmarkRequest;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;

class PostBookmarkController extends Controller
{
    public function store(CreatePostBookmarkRequest $request, Post $post, CreatePostBookmark $action): RedirectResponse
    {
        $action->handle($request->user(), $post);

        return back();
    }

    public function destroy(DeletePostBookmarkRequest $request, Post $post, DeletePostBookmark $action): RedirectResponse
    {
        $action->handle($request->user(), $post);

        return back();
    }
}
@endboostsnippet