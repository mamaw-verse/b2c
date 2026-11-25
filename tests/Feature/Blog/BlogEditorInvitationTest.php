<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\BlogAuthor;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use App\Notifications\BlogEditorInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function invAdmin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function invFor(string $email, array $attributes = []): BlogEditorInvitation
{
    return BlogEditorInvitation::query()->create([
        'email' => $email,
        'invited_by_id' => invAdmin()->id,
        'expires_at' => now()->addDays(7),
        ...$attributes,
    ]);
}

test('an admin invites an editor, a mail is sent and an audit row is written', function () {
    Notification::fake();
    $admin = invAdmin();

    $this->actingAs($admin)->post(route('admin.blog.editor-invitations.store'), ['email' => 'Writer@Example.com'])
        ->assertRedirect();

    $invitation = BlogEditorInvitation::query()->firstOrFail();
    expect($invitation->email)->toBe('writer@example.com')
        ->and($invitation->expires_at->isFuture())->toBeTrue();

    Notification::assertSentOnDemand(BlogEditorInvitationNotification::class);
    expect(AuditLog::query()->where('action', 'blog.editor.invited')->count())->toBe(1);
});

test('editors and buyers cannot invite', function () {
    Notification::fake();

    $this->actingAs(User::factory()->create(['role' => 'editor']))
        ->post(route('admin.blog.editor-invitations.store'), ['email' => 'a@example.com'])->assertNotFound();
    $this->actingAs(User::factory()->create())
        ->post(route('admin.blog.editor-invitations.store'), ['email' => 'a@example.com'])->assertNotFound();
});

test('admins and existing editors cannot be invited, and one open invitation per email', function () {
    Notification::fake();
    $admin = invAdmin();
    $editor = User::factory()->create(['role' => 'editor']);
    invFor('open@example.com');

    $this->actingAs($admin)->post(route('admin.blog.editor-invitations.store'), ['email' => $admin->email])
        ->assertSessionHasErrors('email');
    $this->actingAs($admin)->post(route('admin.blog.editor-invitations.store'), ['email' => $editor->email])
        ->assertSessionHasErrors('email');
    $this->actingAs($admin)->post(route('admin.blog.editor-invitations.store'), ['email' => 'OPEN@example.com'])
        ->assertSessionHasErrors('email');
});

test('the pending cap is enforced', function () {
    Notification::fake();
    config(['blog.editors.max_pending' => 2]);
    invFor('a@example.com');
    invFor('b@example.com');

    $this->actingAs(invAdmin())->post(route('admin.blog.editor-invitations.store'), ['email' => 'c@example.com'])
        ->assertSessionHasErrors('email');
});

test('an admin can revoke and resend, and a revoked link is neutral', function () {
    Notification::fake();
    $admin = invAdmin();
    $invitation = invFor('w@example.com', ['expires_at' => now()->addDay()]);

    $this->actingAs($admin)->post(route('admin.blog.editor-invitations.resend.store', $invitation))->assertRedirect();
    expect($invitation->fresh()->expires_at->gt(now()->addDays(6)))->toBeTrue();
    Notification::assertSentOnDemand(BlogEditorInvitationNotification::class);

    $this->actingAs($admin)->delete(route('admin.blog.editor-invitations.destroy', $invitation))->assertRedirect();
    expect($invitation->fresh()->revoked_at)->not->toBeNull();
    expect(AuditLog::query()->where('action', 'blog.editor.revoked')->count())->toBe(1);

    $this->actingAs($admin)->delete(route('admin.blog.editor-invitations.destroy', $invitation))->assertNotFound();

    $user = User::factory()->create(['email' => 'w@example.com']);
    $this->actingAs($user)->get(route('editor-invitations.show', $invitation))
        ->assertOk()->assertInertia(fn ($page) => $page->component('account/editor-invitation')->where('invitation', null));
});

test('a guest with an account is sent to log in, a new guest to register', function () {
    User::factory()->create(['email' => 'known@example.com']);
    $known = invFor('known@example.com');
    $fresh = invFor('new@example.com');

    $this->get(route('editor-invitations.show', $known))->assertRedirectContains('login');
    $this->get(route('editor-invitations.show', $fresh))->assertRedirectContains('register');
    expect(session('editor_invitation_id'))->toBe($fresh->id);
});

test('accepting needs consent, then sets the role, records consent and creates the author', function () {
    $user = User::factory()->create(['email' => 'w@example.com', 'name' => 'Wafa Writer']);
    $invitation = invFor('W@example.com');

    $this->actingAs($user)->put(route('editor-invitations.update', $invitation), [])->assertSessionHasErrors('consent');
    expect($user->fresh()->role)->not->toBe('editor');

    $this->actingAs($user)->put(route('editor-invitations.update', $invitation), ['consent' => '1'])
        ->assertRedirect(route('admin.blog.posts.index'));

    $author = BlogAuthor::query()->where('user_id', $user->id)->firstOrFail();
    expect($user->fresh()->role)->toBe('editor')
        ->and($invitation->fresh()->accepted_at)->not->toBeNull()
        ->and($author->display_name)->toBe('Wafa Writer')
        ->and($author->consent_confirmed_at)->not->toBeNull()
        ->and($author->consent_confirmed_by_id)->toBe($user->id)
        ->and($author->consent_version)->toBe((string) config('blog.consent_version'))
        ->and(AuditLog::query()->where('action', 'blog.editor.accepted')->count())->toBe(1);
});

test('email mismatch, expiry, suspended users and admins cannot accept', function () {
    $other = User::factory()->create();
    $this->actingAs($other)->put(route('editor-invitations.update', invFor('someone@example.com')), ['consent' => '1'])->assertNotFound();

    $user = User::factory()->create(['email' => 'late@example.com']);
    $this->actingAs($user)->put(route('editor-invitations.update', invFor('late@example.com', ['expires_at' => now()->subMinute()])), ['consent' => '1'])->assertNotFound();

    $suspended = User::factory()->create(['email' => 's@example.com', 'suspended_at' => now()]);
    // A suspended user is logged out and sent to login by EnsureUserNotSuspended before the request runs.
    $this->actingAs($suspended)->put(route('editor-invitations.update', invFor('s@example.com')), ['consent' => '1'])->assertRedirect(route('login'));
    expect($suspended->fresh()->role)->not->toBe('editor');

    $admin = User::factory()->create(['role' => 'admin', 'email' => 'boss@example.com']);
    $this->actingAs($admin)->put(route('editor-invitations.update', invFor('boss@example.com')), ['consent' => '1'])->assertNotFound();
    expect($admin->fresh()->role)->toBe('admin');
});

test('an invitation cannot be accepted twice', function () {
    $user = User::factory()->create(['email' => 'w@example.com']);
    $invitation = invFor('w@example.com');

    $this->actingAs($user)->put(route('editor-invitations.update', $invitation), ['consent' => '1'])->assertRedirect();
    $this->actingAs($user->fresh())
        ->put(route('editor-invitations.update', $invitation), ['consent' => '1'])->assertNotFound();
});

test('removing an editor returns the role to buyer, deactivates the profile and keeps posts credited', function () {
    $admin = invAdmin();
    $editor = User::factory()->create(['role' => 'editor']);
    $author = BlogAuthor::factory()->create(['user_id' => $editor->id]);
    $post = App\Models\BlogPost::factory()->create(['blog_author_id' => $author->id]);

    $this->actingAs($admin)->delete(route('admin.blog.editors.destroy', $editor))->assertRedirect();

    expect($editor->fresh()->role)->toBe('buyer')
        ->and($author->fresh()->is_active)->toBeFalse()
        ->and($post->fresh()->blog_author_id)->toBe($author->id)
        ->and(AuditLog::query()->where('action', 'blog.editor.removed')->count())->toBe(1);

    $this->actingAs($admin)->delete(route('admin.blog.editors.destroy', User::factory()->create()))->assertNotFound();
});

test('the editors page lists editors and pending invitations for admins only', function () {
    invFor('p@example.com');
    User::factory()->create(['role' => 'editor']);

    $this->actingAs(invAdmin())->get(route('admin.blog.editors.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/blog/editors')->has('editors', 1)->has('invitations', 1));
    $this->actingAs(User::factory()->create(['role' => 'editor']))->get(route('admin.blog.editors.index'))->assertNotFound();
});
