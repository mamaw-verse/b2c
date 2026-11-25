<?php

declare(strict_types=1);

namespace App\Support\Blog;

use InvalidArgumentException;
use League\CommonMark\Node\Node;
use League\CommonMark\Renderer\ChildNodeRendererInterface;
use League\CommonMark\Renderer\NodeRendererInterface;

final class BlogTrustedHtmlRenderer implements NodeRendererInterface
{
    public function render(Node $node, ChildNodeRendererInterface $childRenderer): string
    {
        if (! $node instanceof BlogTrustedHtml) {
            throw new InvalidArgumentException('Incompatible node type: '.$node::class);
        }

        return $node->html;
    }
}
