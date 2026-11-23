<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

/**
 * FAQ tests (docs/planning/14 T4.4).
 *
 * @return array<string, mixed>
 */
function faqJsonLd(TestResponse $response): array
{
    preg_match_all('#<script type="application/ld\+json">\s*(.*?)\s*</script>#s', $response->getContent(), $matches);

    expect($matches[1])->toHaveCount(1);

    return json_decode($matches[1][0], true, flags: JSON_THROW_ON_ERROR);
}

/**
 * @param  array<string, mixed>  $document
 * @return array<string, mixed>|null
 */
function faqNode(array $document): ?array
{
    foreach ($document['@graph'] ?? [] as $node) {
        if (($node['@type'] ?? null) === 'FAQPage') {
            return $node;
        }
    }

    return null;
}

/**
 * @param  array<string, mixed>  $node
 * @return list<array{question: string, answer: string}>
 */
function faqPairs(array $node): array
{
    return array_map(
        fn (array $q): array => ['question' => $q['name'], 'answer' => $q['acceptedAnswer']['text']],
        $node['mainEntity'],
    );
}

test('why choose us FAQ props are exactly what the FAQPage JSON-LD describes', function () {
    $response = $this->get(route('why-choose-us'))->assertOk();

    $props = $response->viewData('page')['props']['faqs'];
    $node = faqNode(faqJsonLd($response));

    expect($props)->not->toBeEmpty()
        ->and($node)->not->toBeNull()
        ->and(faqPairs($node))->toBe($props)
        ->and($node['@id'])->toEndWith('/why-choose-us#faq')
        ->and($node['isPartOf']['@id'])->toEndWith('/why-choose-us#webpage');
});

test('FAQPage questions and answers are non-empty plain text', function () {
    $node = faqNode(faqJsonLd($this->get(route('why-choose-us'))->assertOk()));

    foreach (faqPairs($node) as $pair) {
        expect(mb_trim($pair['question']))->not->toBe('')
            ->and(mb_trim($pair['answer']))->not->toBe('')
            ->and($pair['answer'])->toBe(strip_tags($pair['answer']));
    }
});

test('returns page FAQ states the configured return window', function () {
    config(['marketplace.pages.returns.enabled' => true, 'marketplace.return_window_days' => 10]);

    $response = $this->get('/pages/returns')->assertOk();
    $props = $response->viewData('page')['props']['faqs'];
    $node = faqNode(faqJsonLd($response));

    expect($props)->toHaveCount(4)
        ->and($props[0]['answer'])->toContain('within 10 days')
        ->and(faqPairs($node))->toBe($props);
});

test('returns page FAQ collapses to one entry when returns are not permitted', function () {
    config(['marketplace.pages.returns.enabled' => true, 'marketplace.return_window_days' => 0]);

    $props = $this->get('/pages/returns')->assertOk()->viewData('page')['props']['faqs'];

    expect($props)->toHaveCount(1)
        ->and($props[0]['answer'])->toContain('not accepted');
});

test('content pages without a FAQ carry no FAQPage markup and an empty faqs prop', function () {
    config(['marketplace.pages.about.enabled' => true]);

    $response = $this->get('/pages/about')->assertOk();

    expect($response->viewData('page')['props']['faqs'])->toBe([])
        ->and(faqNode(faqJsonLd($response)))->toBeNull();
});

test('the halal verification FAQ appears only when the claim is enabled', function () {
    $off = $this->get(route('why-choose-us'))->assertOk()->viewData('page')['props']['faqs'];
    expect(collect($off)->pluck('question')->implode(' '))->not->toContain('verify halal');

    config(['marketplace.claims.halal_verification' => true]);

    $on = $this->get(route('why-choose-us'))->assertOk()->viewData('page')['props']['faqs'];
    expect(collect($on)->pluck('question')->implode(' '))->toContain('verify halal');
});

test('the halal verification page gets a FAQ only when the claim is enabled', function () {
    config(['marketplace.pages.halal-verification.enabled' => true]);

    $off = $this->get('/pages/halal-verification')->assertOk();
    expect($off->viewData('page')['props']['faqs'])->toBe([])
        ->and(faqNode(faqJsonLd($off)))->toBeNull();

    config(['marketplace.claims.halal_verification' => true]);

    $on = $this->get('/pages/halal-verification')->assertOk();
    expect(faqPairs(faqNode(faqJsonLd($on))))->toBe($on->viewData('page')['props']['faqs']);
});
