<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogImage;
use App\Support\Blog\BlogFacts;
use App\Support\Blog\BlogTrustedHtml;
use App\Support\Blog\BlogTrustedHtmlRenderer;
use App\Support\Blog\RenderedBlogBody;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Block\Heading;
use League\CommonMark\Extension\CommonMark\Node\Inline\Code;
use League\CommonMark\Extension\CommonMark\Node\Inline\Image;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Node\Block\Document;
use League\CommonMark\Node\Block\Paragraph;
use League\CommonMark\Node\Inline\Text;
use League\CommonMark\Node\Node;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

/**
 * Markdown to sanitized HTML for blog posts (docs/planning/15-blog.md §7.1, §7.2).
 *
 * Raw HTML is stripped, unsafe links are blocked, images only resolve through the
 * `blog-image:{id}` scheme, and `[[product:slug]]` on a line of its own becomes a
 * marker element that the page replaces with a live product card.
 */
final readonly class RenderBlogBody
{
    private const IMAGE_SCHEME = 'blog-image:';

    private const ULID = '/^[0-9a-hjkmnp-tv-z]{26}$/';

    private const PRODUCT_LINE = '/^\[\[product:([a-z0-9]+(?:-[a-z0-9]+)*)\]\]$/';

    private const ALLOWED_LINK_SCHEMES = ['http', 'https', 'mailto', 'tel'];

    /** Deepest heading level in the output (`#` becomes h2, anything past h4 is flattened). */
    private const MAX_HEADING_LEVEL = 4;

    private const WORDS_PER_MINUTE = 200;

    public function handle(string $markdown): RenderedBlogBody
    {
        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
            'max_nesting_level' => 30,
        ]);
        $environment->addExtension(new CommonMarkCoreExtension);
        $environment->addRenderer(BlogTrustedHtml::class, new BlogTrustedHtmlRenderer);

        $document = (new MarkdownParser($environment))->parse($markdown);

        $errors = [];
        $warnings = [];

        $this->rewriteLinks($document);
        $imageIds = $this->rewriteImages($document, $errors, $warnings);
        $productSlugs = $this->rewriteProductEmbeds($document, $warnings);
        $this->checkFacts($document, $errors);
        $toc = $this->rewriteHeadings($document);
        $words = $this->countWords($document);

        $html = mb_trim((new HtmlRenderer($environment))->renderDocument($document)->getContent());

        return new RenderedBlogBody(
            html: $html,
            toc: $toc,
            wordCount: $words,
            readingMinutes: max(1, (int) ceil($words / self::WORDS_PER_MINUTE)),
            imageIds: $imageIds,
            productSlugs: $productSlugs,
            errors: array_values(array_unique($errors)),
            warnings: array_values(array_unique($warnings)),
        );
    }

    private function countWords(Document $document): int
    {
        $parts = [];
        $walker = $document->walker();
        while (($event = $walker->next()) !== null) {
            if (! $event->isEntering()) {
                continue;
            }
            $node = $event->getNode();
            if ($node instanceof Text || $node instanceof Code) {
                $parts[] = $node->getLiteral();
            }
        }

        $words = preg_split('/\s+/u', mb_trim(implode(' ', $parts)), -1, PREG_SPLIT_NO_EMPTY);

        return $words === false ? 0 : count($words);
    }

    /**
     * Blocks unknown schemes and marks external links `target=_blank` with the rel values from §7.1.
     */
    private function rewriteLinks(Document $document): void
    {
        $ownHost = mb_strtolower((string) parse_url((string) config('app.url'), PHP_URL_HOST));
        $nofollow = (bool) config('blog.nofollow_external', true);

        foreach ($this->collect($document, Link::class) as $link) {
            $url = mb_trim($link->getUrl());

            if (preg_match('/^([a-z][a-z0-9+.\-]*):/i', $url, $match) === 1
                && ! in_array(mb_strtolower($match[1]), self::ALLOWED_LINK_SCHEMES, true)) {
                $link->setUrl('');

                continue;
            }

            $host = null;
            if (str_starts_with($url, '//')) {
                $host = mb_strtolower((string) parse_url('https:'.$url, PHP_URL_HOST));
            } elseif (preg_match('#^https?://#i', $url) === 1) {
                $host = mb_strtolower((string) parse_url($url, PHP_URL_HOST));
            }

            if ($host === null || $host === '' || $host === $ownHost) {
                continue;
            }

            $link->data->set('attributes/target', '_blank');
            $link->data->set('attributes/rel', 'noopener noreferrer'.($nofollow ? ' nofollow' : ''));
        }
    }

    /**
     * Turns `![alt](blog-image:ID "caption")` paragraphs into figures; drops every other image.
     *
     * @param  list<string>  $errors
     * @param  list<string>  $warnings
     * @return list<string>
     */
    private function rewriteImages(Document $document, array &$errors, array &$warnings): array
    {
        /** @var list<Image> $images */
        $images = $this->collect($document, Image::class);

        $ids = [];
        foreach ($images as $image) {
            $id = $this->imageId($image->getUrl());
            if ($id !== null && preg_match(self::ULID, $id) === 1) {
                $ids[$id] = true;
            }
        }

        /** @var array<string, BlogImage> $rows */
        $rows = $ids === [] ? [] : BlogImage::query()->whereIn('id', array_keys($ids))->get()->keyBy('id')->all();

        $handled = [];
        foreach ($this->collect($document, Paragraph::class) as $paragraph) {
            $child = $paragraph->firstChild();
            if (! $child instanceof Image || $paragraph->lastChild() !== $child) {
                continue;
            }

            $handled[spl_object_id($child)] = true;
            $id = $this->imageId($child->getUrl());

            if ($id === null) {
                $warnings[] = 'An image that does not use blog-image: was removed.';
                $paragraph->detach();

                continue;
            }

            $row = preg_match(self::ULID, $id) === 1 ? ($rows[$id] ?? null) : null;
            if ($row === null) {
                $errors[] = "Unknown image: {$id}";
                $paragraph->detach();

                continue;
            }

            $paragraph->replaceWith(new BlogTrustedHtml($this->figure($row, $this->plainText($child), $child->getTitle())));
        }

        foreach ($images as $image) {
            if (isset($handled[spl_object_id($image)])) {
                continue;
            }
            $warnings[] = 'An image inside a sentence or link was removed. Put each image on its own line.';
            $image->detach();
        }

        return array_keys($ids);
    }

    private function imageId(string $url): ?string
    {
        $url = mb_trim($url);

        return str_starts_with(mb_strtolower($url), self::IMAGE_SCHEME)
            ? mb_strtolower(mb_substr($url, mb_strlen(self::IMAGE_SCHEME)))
            : null;
    }

    private function figure(BlogImage $image, string $markdownAlt, ?string $title): string
    {
        $disk = Storage::disk($image->disk);
        $variants = $image->variants;

        $sources = [];
        foreach (['thumb', 'medium', 'large'] as $name) {
            if (isset($variants[$name]['path'], $variants[$name]['width'])) {
                $sources[] = $disk->url($variants[$name]['path']).' '.(int) $variants[$name]['width'].'w';
            }
        }

        $main = $variants['large'] ?? $variants['medium'] ?? null;
        $src = $main !== null ? $disk->url($main['path']) : $disk->url($image->original_path);
        $width = $main['width'] ?? $image->width;
        $height = $main['height'] ?? $image->height;

        $alt = $markdownAlt !== '' ? $markdownAlt : (string) $image->alt;
        $caption = ($title !== null && mb_trim($title) !== '') ? mb_trim($title) : mb_trim((string) $image->caption);

        $html = '<figure><img src="'.e($src).'"';
        if ($sources !== []) {
            $html .= ' srcset="'.e(implode(', ', $sources)).'" sizes="(min-width: 768px) 720px, 100vw"';
        }
        $html .= ' width="'.(int) $width.'" height="'.(int) $height.'" loading="lazy" decoding="async" alt="'.e($alt).'">';
        if ($caption !== '') {
            $html .= '<figcaption>'.e($caption).'</figcaption>';
        }

        return $html.'</figure>';
    }

    /**
     * @param  list<string>  $warnings
     * @return list<string>
     */
    private function rewriteProductEmbeds(Document $document, array &$warnings): array
    {
        $slugs = [];

        foreach ($this->collect($document, Paragraph::class) as $paragraph) {
            $literal = '';
            $onlyText = true;
            foreach ($paragraph->children() as $child) {
                if ($child instanceof Text) {
                    $literal .= $child->getLiteral();
                } else {
                    $onlyText = false;
                }
            }

            if ($onlyText && preg_match(self::PRODUCT_LINE, mb_trim($literal), $match) === 1) {
                $slugs[$match[1]] = true;
                $paragraph->replaceWith(new BlogTrustedHtml('<div data-blog-product="'.e($match[1]).'"></div>'."\n"));

                continue;
            }

            if (str_contains($literal, '[[product:')) {
                $warnings[] = 'A [[product:slug]] token must be on a line by itself; inline use is ignored.';
            }
        }

        return array_keys($slugs);
    }

    /**
     * Validates `[[fact:key]]` tokens (B4.5). The tokens stay in the stored HTML and are resolved on
     * every render (`BlogFacts::resolve`), so here they only need to be known and currently backed.
     *
     * @param  list<string>  $errors
     */
    private function checkFacts(Document $document, array &$errors): void
    {
        foreach ([Heading::class, Paragraph::class] as $class) {
            foreach ($this->collect($document, $class) as $block) {
                // Text nodes only: a token inside `inline code` is documentation, not a claim.
                foreach (BlogFacts::tokensIn($this->textOnly($block)) as $key) {
                    if ($class === Heading::class) {
                        $errors[] = 'A [[fact:…]] token cannot be used in a heading.';

                        continue;
                    }

                    if (preg_match('/^[a-z][a-z0-9_]*$/', $key) !== 1 || ! BlogFacts::isKnown($key)) {
                        $errors[] = "Unknown fact: {$key}. Available: ".implode(', ', BlogFacts::keys()).'.';

                        continue;
                    }

                    if (BlogFacts::value($key) === null) {
                        $errors[] = "The fact \"{$key}\" is not available right now because the marketplace setting behind it is off or empty.";
                    }
                }
            }
        }
    }

    private function textOnly(Node $node): string
    {
        $parts = [];
        $walker = $node->walker();
        while (($event = $walker->next()) !== null) {
            if ($event->isEntering() && $event->getNode() instanceof Text) {
                $parts[] = $event->getNode()->getLiteral();
            }
        }

        return implode('', $parts);
    }

    /**
     * Shifts headings down one level (the page title is the only h1), flattens past h4,
     * assigns unique ids, and returns the h2/h3 table of contents.
     *
     * @return list<array{id: string, text: string, level: int}>
     */
    private function rewriteHeadings(Document $document): array
    {
        $toc = [];
        $used = [];

        foreach ($this->collect($document, Heading::class) as $heading) {
            $level = min($heading->getLevel() + 1, self::MAX_HEADING_LEVEL);
            $text = $this->plainText($heading);

            $base = Str::slug($text) ?: 'section';
            $id = $base;
            for ($n = 2; isset($used[$id]); $n++) {
                $id = "{$base}-{$n}";
            }
            $used[$id] = true;

            $replacement = new Heading($level);
            foreach (iterator_to_array($heading->children(), false) as $child) {
                $replacement->appendChild($child);
            }
            $replacement->data->set('attributes/id', $id);
            $heading->replaceWith($replacement);

            if ($level <= 3 && $text !== '') {
                $toc[] = ['id' => $id, 'text' => $text, 'level' => $level];
            }
        }

        return $toc;
    }

    private function plainText(Node $node): string
    {
        $parts = [];
        $walker = $node->walker();
        while (($event = $walker->next()) !== null) {
            if (! $event->isEntering()) {
                continue;
            }
            $current = $event->getNode();
            if ($current instanceof Text || $current instanceof Code) {
                $parts[] = $current->getLiteral();
            }
        }

        return mb_trim((string) preg_replace('/\s+/u', ' ', implode('', $parts)));
    }

    /**
     * Collects nodes first so the tree can be changed without disturbing the walker.
     *
     * @template T of Node
     *
     * @param  class-string<T>  $class
     * @return list<T>
     */
    private function collect(Document $document, string $class): array
    {
        $found = [];
        $walker = $document->walker();
        while (($event = $walker->next()) !== null) {
            if ($event->isEntering() && $event->getNode() instanceof $class) {
                $found[] = $event->getNode();
            }
        }

        return $found;
    }
}
