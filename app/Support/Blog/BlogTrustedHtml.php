<?php

declare(strict_types=1);

namespace App\Support\Blog;

use League\CommonMark\Node\Block\AbstractBlock;

/**
 * A block of HTML that only `RenderBlogBody` can create (figures and product
 * markers). Author-supplied raw HTML never reaches this node: CommonMark strips
 * it at parse time (`html_input: strip`), so everything here was built from
 * escaped values.
 */
final class BlogTrustedHtml extends AbstractBlock
{
    public function __construct(public readonly string $html)
    {
        parent::__construct();
    }
}
