# Form requests

- Never use policies or gates: no `app/Policies`, no `Gate::define()`, no `can:` middleware, no `$user->can()`, no `$this->authorize()`.
- Authorization and validation only ever happen in form requests: authorization in `authorize()`, validation in `rules()`. Never in controllers, actions, or models. This includes `index` and `show` endpoints.
- Controllers and actions never check anything themselves: no `abort()`, `abort_if()`, `abort_unless()`, `throw_if()`, `throw_unless()`, `Validator::make()`, `$request->validate()`, or `ValidationException`.
- Create a dedicated form request for each endpoint that checks anything, and never share one between endpoints. If the endpoint has none yet, create one.
- Name it after the controller method it serves, CRUD by design: `index` → `List…Request`, `show` → `Show…Request`, `store` → `Create…Request`, `update` → `Update…Request`, `destroy` → `Delete…Request`. For example `PostPinController@update` → `UpdatePostPinRequest`, `PostPinController@destroy` → `DeletePostPinRequest`, `PostApprovalController@store` → `CreatePostApprovalRequest`.
- When hiding something should look like it does not exist, return `Response::denyAsNotFound()` from `authorize()` instead of `false`.
- Put input interpretation in form request methods (`$request->tab()`, `$request->parent()`), and complex checks in custom validation rule classes (`App\Rules`).
- Follow the existing conventions in the codebase (namespaces, `declare(strict_types=1)`, class modifiers) rather than introducing new ones.

@boostsnippet('Example form request', 'php')
<?php

namespace App\Http\Requests;

use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

class CreatePostBookmarkRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $post = $this->route('post');
        assert($post instanceof Post);

        return $post->isVisibleTo($user) ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array{}
     */
    public function rules(): array
    {
        return [];
    }
}
@endboostsnippet