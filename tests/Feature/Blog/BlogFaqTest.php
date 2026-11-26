<?php

declare(strict_types=1);

use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\Blog\BlogFaqs;
use App\Support\Schema\JsonLdValidator;
use App\Support\Schema\SchemaId;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['blog.enabled' => true, 'app.url' => 'https://halalbenta.test']);
    Cache::flush();
});

function faqAdmin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

/** @return array<string, mixed> */
function faqPayload(array $overrides = []): array
{
    return [
        'title' => 'Halal Pantry Guide',
        'excerpt' => 'A short guide to stocking a halal pantry with confidence, from spices to sauces.',
        'body_markdown' => "# Start here\n\n".implode(' ', array_fill(0, 200, 'pantry')),
        'blog_category_id' => BlogCategory::factory()->create()->id,
        'blog_author_id' => BlogAuthor::factory()->create()->id,
        ...$overrides,
    ];
}

/** @return list<array{question: string, answer: string}> */
function faqEntries(int $count = 2): array
{
    return array_map(
        fn (int $n): array => ['question' => "Question number {$n}?", 'answer' => "Answer number {$n}."],
        range(1, $count),
    );
}

/** @return array<string, mixed>|null */
function faqNode(string $html): ?array
{
    $blocks = (new JsonLdValidator)->extract($html);
    $document = json_decode($blocks[0], true, flags: JSON_THROW_ON_ERROR);

    foreach ($document['@graph'] as $node) {
        if (($node['@type'] ?? null) === 'FAQPage') {
            return $node;
        }
    }

    return null;
}

// ---- normaliser ----

test('the normaliser trims, drops incomplete rows, caps the list and returns null for none', function () {
    expect(BlogFaqs::normalize(null))->toBeNull()
        ->and(BlogFaqs::normalize([]))->toBeNull()
        ->and(BlogFaqs::normalize('nope'))->toBeNull()
        ->and(BlogFaqs::normalize([['question' => '  ', 'answer' => ' ']]))->toBeNull()
        ->and(BlogFaqs::normalize([['question' => 'Only a question?', 'answer' => '']]))->toBeNull()
        ->and(BlogFaqs::normalize([
            ['question' => '  Is it halal?  ', 'answer' => "  Yes.\r\nCheck the label.  "],
            'garbage',
            ['question' => null, 'answer' => 'Orphan answer'],
        ]))->toBe([['question' => 'Is it halal?', 'answer' => "Yes.\nCheck the label."]])
        ->and(BlogFaqs::normalize(faqEntries(15)))->toHaveCount(BlogFaqs::MAX_ENTRIES);
});

// ---- authoring ----

test('creating a post stores normalised FAQs and ignores blank rows', function () {
    $this->actingAs(faqAdmin())->post(route('admin.blog.posts.store'), faqPayload([
        'faqs' => [...faqEntries(2), ['question' => '', 'answer' => '']],
    ]))->assertRedirect();

    expect(BlogPost::query()->firstOrFail()->faqs)->toBe(faqEntries(2));
});

test('a post without FAQs stores null', function () {
    $this->actingAs(faqAdmin())->post(route('admin.blog.posts.store'), faqPayload())->assertRedirect();

    expect(BlogPost::query()->firstOrFail()->faqs)->toBeNull();
});

test('updating replaces FAQs, an empty list clears them, and omitting the key keeps them', function () {
    $admin = faqAdmin();
    $post = BlogPost::factory()->draft()->create(['faqs' => faqEntries(2)]);
    $payload = faqPayload(['blog_category_id' => $post->blog_category_id, 'blog_author_id' => $post->blog_author_id]);

    $this->actingAs($admin)->put(route('admin.blog.posts.update', $post), $payload)->assertRedirect();
    expect($post->fresh()->faqs)->toBe(faqEntries(2));

    $this->actingAs($admin)->put(route('admin.blog.posts.update', $post), [...$payload, 'faqs' => faqEntries(1)])->assertRedirect();
    expect($post->fresh()->faqs)->toBe(faqEntries(1));

    $this->actingAs($admin)->put(route('admin.blog.posts.update', $post), [...$payload, 'faqs' => []])->assertRedirect();
    expect($post->fresh()->faqs)->toBeNull();
});

test('the edit screen receives the saved FAQs and the limits', function () {
    $post = BlogPost::factory()->draft()->create(['faqs' => faqEntries(2)]);

    $this->actingAs(faqAdmin())->get(route('admin.blog.posts.edit', $post))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/blog/post-form')
            ->where('post.faqs', faqEntries(2))
            ->where('limits.faq_max', BlogFaqs::MAX_ENTRIES));
});

test('FAQ validation: a half-filled row, duplicate questions, too many and too long entries are refused', function () {
    $admin = faqAdmin();

    $this->actingAs($admin)->post(route('admin.blog.posts.store'), faqPayload(['faqs' => [['question' => 'Why?', 'answer' => '']]]))
        ->assertSessionHasErrors('faqs.0.answer');

    $this->actingAs($admin)->post(route('admin.blog.posts.store'), faqPayload(['faqs' => [['question' => '', 'answer' => 'An answer']]]))
        ->assertSessionHasErrors('faqs.0.question');

    $this->actingAs($admin)->post(route('admin.blog.posts.store'), faqPayload(['faqs' => [
        ['question' => 'Same question?', 'answer' => 'One'],
        ['question' => 'same QUESTION?', 'answer' => 'Two'],
    ]]))->assertSessionHasErrors('faqs.0.question');

    $this->actingAs($admin)->post(route('admin.blog.posts.store'), faqPayload(['faqs' => faqEntries(BlogFaqs::MAX_ENTRIES + 1)]))
        ->assertSessionHasErrors('faqs');

    $this->actingAs($admin)->post(route('admin.blog.posts.store'), faqPayload(['faqs' => [
        ['question' => str_repeat('q', BlogFaqs::QUESTION_MAX + 1), 'answer' => str_repeat('a', BlogFaqs::ANSWER_MAX + 1)],
    ]]))->assertSessionHasErrors(['faqs.0.question', 'faqs.0.answer']);

    expect(BlogPost::query()->count())->toBe(0);
});

test('editors can save FAQs on their own posts', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $own = BlogAuthor::factory()->create(['user_id' => $editor->id]);

    $this->actingAs($editor)->post(route('admin.blog.posts.store'), faqPayload(['blog_author_id' => $own->id, 'faqs' => faqEntries(1)]))->assertRedirect();

    expect(BlogPost::query()->firstOrFail()->faqs)->toBe(faqEntries(1));
});

// ---- public page and markup ----

test('visible FAQ and FAQPage markup are the same list, and the page still validates', function () {
    $faqs = [
        ['question' => 'Is it halal?', 'answer' => "Check the label.\nLook for the logo."],
        ['question' => 'Where do I buy it?', 'answer' => 'From an approved shop on HalalBenta.'],
    ];
    $post = BlogPost::factory()->published()->create(['faqs' => $faqs]);

    $response = $this->get(route('blog.show', $post))->assertOk();
    $html = $response->getContent();

    $visible = $response->viewData('page')['props']['post']['faqs'];
    $node = faqNode($html);

    expect($node)->not->toBeNull()
        ->and($visible)->toBe($faqs)
        ->and(array_map(
            fn (array $question): array => ['question' => $question['name'], 'answer' => $question['acceptedAnswer']['text']],
            $node['mainEntity'],
        ))->toBe($visible)
        ->and($node['@id'])->toBe(SchemaId::faq("https://halalbenta.test/blog/{$post->slug}"))
        ->and($node['isPartOf'])->toBe(['@id' => SchemaId::webPage("https://halalbenta.test/blog/{$post->slug}")]);

    $result = (new JsonLdValidator)->validateHtml($html, [SchemaId::organization(), SchemaId::website()]);

    expect($result['errors'])->toBe([]);
});

test('a post without FAQs shows none and emits no FAQ markup', function () {
    $post = BlogPost::factory()->published()->create(['faqs' => null]);

    $response = $this->get(route('blog.show', $post))->assertOk();

    expect($response->viewData('page')['props']['post']['faqs'])->toBe([])
        ->and(faqNode($response->getContent()))->toBeNull()
        ->and($response->getContent())->not->toContain('FAQPage');
});

test('FAQ text cannot break out of the JSON-LD script tag', function () {
    $post = BlogPost::factory()->published()->create(['faqs' => [
        ['question' => 'What about </script><script>alert(1)</script>?', 'answer' => 'Nothing & <b>nothing</b>.'],
    ]]);

    $html = $this->get(route('blog.show', $post))->assertOk()->getContent();

    expect($html)->not->toContain('<script>alert(1)</script>')
        ->and(faqNode($html)['mainEntity'][0]['name'])->toBe('What about </script><script>alert(1)</script>?');
});

test('stored rows that are no longer complete are never shown or described', function () {
    $post = BlogPost::factory()->published()->create(['faqs' => [
        ['question' => 'Kept?', 'answer' => 'Yes.'],
        ['question' => 'Half a row', 'answer' => ''],
    ]]);

    $response = $this->get(route('blog.show', $post))->assertOk();

    expect($response->viewData('page')['props']['post']['faqs'])->toBe([['question' => 'Kept?', 'answer' => 'Yes.']])
        ->and(faqNode($response->getContent())['mainEntity'])->toHaveCount(1);
});
