<?php

declare(strict_types=1);

use App\Actions\Blog\RenderBlogBody;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\Blog\BlogFacts;
use App\Support\Blog\BlogSegments;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    config([
        'blog.enabled' => true,
        'marketplace.return_window_days' => 7,
        'marketplace.auto_confirm_days' => 7,
        'marketplace.couriers' => ['LBC', 'J&T Express'],
        'marketplace.payments' => ['GCash', 'Maya'],
        'marketplace.claims.halal_verification' => false,
    ]);
});

function factRender(string $markdown): App\Support\Blog\RenderedBlogBody
{
    return app(RenderBlogBody::class)->handle($markdown);
}

// ---- values come from the live settings ----

test('value facts follow the marketplace settings', function () {
    expect(BlogFacts::value('return_window'))->toBe('7 days')
        ->and(BlogFacts::value('auto_confirm_window'))->toBe('7 days')
        ->and(BlogFacts::value('courier_list'))->toBe('LBC, J&T Express')
        ->and(BlogFacts::value('payment_list'))->toBe('GCash, Maya');

    config(['marketplace.return_window_days' => 1, 'marketplace.couriers' => ['JRS']]);

    expect(BlogFacts::value('return_window'))->toBe('1 day')
        ->and(BlogFacts::value('courier_list'))->toBe('JRS');
});

test('a fact the settings do not back has no value', function () {
    config([
        'marketplace.return_window_days' => 0,
        'marketplace.auto_confirm_days' => 0,
        'marketplace.couriers' => [],
        'marketplace.payments' => ['', '  '],
    ]);

    foreach (['return_window', 'auto_confirm_window', 'courier_list', 'payment_list', 'halal_verification'] as $key) {
        expect(BlogFacts::value($key))->toBeNull();
    }

    expect(BlogFacts::value('not_a_fact'))->toBeNull();
});

test('statement facts reuse the TrustFacts sentences, and the halal claim stays behind its flag', function () {
    expect(BlogFacts::value('escrow'))->toStartWith('Escrow-protected checkout')
        ->and(BlogFacts::value('returns'))->toContain('within 7 days')
        ->and(BlogFacts::value('halal_verification'))->toBeNull();

    config(['marketplace.claims.halal_verification' => true]);

    expect(BlogFacts::value('halal_verification'))->toContain('Halal certificates');
});

test('every advertised key is known', function () {
    foreach (BlogFacts::keys() as $key) {
        expect(BlogFacts::isKnown($key))->toBeTrue();
    }

    expect(BlogFacts::isKnown('return_window_days'))->toBeFalse();
});

// ---- the renderer validates tokens ----

test('a known, backed fact renders without errors and the token stays in the stored html', function () {
    $out = factRender('Returns are open for [[fact:return_window]] after delivery.');

    expect($out->errors)->toBe([])
        ->and($out->html)->toContain('[[fact:return_window]]');
});

test('an unknown fact is a blocking error that lists the available keys', function () {
    $out = factRender('Returns take [[fact:return_days]].');

    expect($out->errors)->toHaveCount(1)
        ->and($out->errors[0])->toContain('Unknown fact: return_days')
        ->and($out->errors[0])->toContain('return_window');
});

test('a malformed token is reported rather than printed to readers', function () {
    $out = factRender('Typo [[fact:Return-Window]] here.');

    expect($out->errors)->toHaveCount(1)
        ->and($out->errors[0])->toContain('Unknown fact');
});

test('a fact whose setting is off cannot be published', function () {
    config(['marketplace.return_window_days' => 0]);

    $out = factRender('Returns within [[fact:return_window]].');

    expect($out->errors)->toHaveCount(1)
        ->and($out->errors[0])->toContain('not available right now');
});

test('facts cannot sit in a heading', function () {
    $out = factRender("## Returns in [[fact:return_window]]\n\nBody text.");

    expect($out->errors)->toContain('A [[fact:…]] token cannot be used in a heading.');
});

test('a token inside inline code or a code block is documentation, not a claim', function () {
    $out = factRender("Write `[[fact:nonsense]]` to insert a fact.\n\n```\n[[fact:also_nonsense]]\n```");

    expect($out->errors)->toBe([]);
});

test('tokens split across emphasis are still found', function () {
    $out = factRender('Window: [[fact:*oops*]] and [[fact:return_window]].');

    expect($out->errors)->not->toBe([]);
});

// ---- resolve at render time ----

test('resolve fills tokens with escaped current values', function () {
    $html = '<p>We ship with [[fact:courier_list]]. Returns: [[fact:return_window]].</p>';

    expect(BlogFacts::resolve($html))->toBe('<p>We ship with LBC, J&amp;T Express. Returns: 7 days.</p>');
});

test('resolve leaves code and pre blocks alone and removes unavailable facts', function () {
    config(['marketplace.couriers' => []]);

    $html = '<p>Couriers: [[fact:courier_list]]!</p><p>Syntax: <code>[[fact:return_window]]</code></p><pre>[[fact:return_window]]</pre>';

    expect(BlogFacts::resolve($html))
        ->toBe('<p>Couriers: !</p><p>Syntax: <code>[[fact:return_window]]</code></p><pre>[[fact:return_window]]</pre>');
});

test('html without tokens is returned untouched', function () {
    expect(BlogFacts::resolve('<p>Plain [text]</p>'))->toBe('<p>Plain [text]</p>');
});

test('segments resolve facts so a policy change updates a published post without a re-save', function () {
    $html = '<p>Return within [[fact:return_window]].</p>';

    expect(app(BlogSegments::class)->handle($html)[0]['html'])->toBe('<p>Return within 7 days.</p>');

    config(['marketplace.return_window_days' => 14]);

    expect(app(BlogSegments::class)->handle($html)[0]['html'])->toBe('<p>Return within 14 days.</p>');
});

test('the public post page serves the resolved value', function () {
    $post = BlogPost::factory()->published()->create(['body_html' => '<p>Return within [[fact:return_window]].</p>']);
    config(['marketplace.return_window_days' => 14]);

    $this->get(route('blog.show', $post))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('post.segments.0.html', '<p>Return within 14 days.</p>'));
});

test('the markdown preview endpoint resolves facts like the public page', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $response = $this->actingAs($editor)->postJson(route('admin.blog.markdown-preview.store'), [
        'markdown' => 'Return within [[fact:return_window]].',
    ])->assertOk();

    expect($response->json('html'))->toContain('Return within 7 days.')
        ->and($response->json('errors'))->toBe([]);
});

test('the post form tells editors which fact keys exist', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)->get(route('admin.blog.posts.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('limits.fact_keys', BlogFacts::keys()));
});
