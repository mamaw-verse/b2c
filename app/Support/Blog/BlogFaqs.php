<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Models\BlogPost;

/**
 * FAQ entries of a blog post (docs/planning/15-blog.md B3.6).
 *
 * One normaliser feeds every consumer: the save path stores what `normalize()` returns, and the
 * post page props and the `FAQPage` JSON-LD both read `for()`. The visible FAQ and the markup are
 * therefore the same list by construction (the parity guarantee from docs/planning/14 T4.4).
 * Questions and answers are plain text: the page renders them escaped and the graph encodes them
 * with `SchemaGraph::encode()`.
 */
final readonly class BlogFaqs
{
    public const int MAX_ENTRIES = 10;

    public const int QUESTION_MAX = 200;

    public const int ANSWER_MAX = 1000;

    /**
     * Trims, normalises line endings and drops rows that are not a complete question and answer.
     * Returns null for "no FAQ", so a post without one stores nothing and emits no markup.
     *
     * @return list<array{question: string, answer: string}>|null
     */
    public static function normalize(mixed $raw): ?array
    {
        if (! is_array($raw)) {
            return null;
        }

        $entries = [];

        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }

            $question = self::clean($row['question'] ?? null);
            $answer = self::clean($row['answer'] ?? null);

            if ($question === '' || $answer === '') {
                continue;
            }

            $entries[] = ['question' => $question, 'answer' => $answer];
        }

        $entries = array_slice($entries, 0, self::MAX_ENTRIES);

        return $entries === [] ? null : $entries;
    }

    /**
     * What the post page shows and the graph describes.
     *
     * @return list<array{question: string, answer: string}>
     */
    public static function for(BlogPost $post): array
    {
        return self::normalize($post->faqs) ?? [];
    }

    private static function clean(mixed $value): string
    {
        if (! is_string($value)) {
            return '';
        }

        return mb_trim(str_replace(["\r\n", "\r"], "\n", $value));
    }
}
