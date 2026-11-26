import {
    BlogProductCard,
    type BlogProductList,
} from '@/components/blog/blog-product-card';
import { cn } from '@/lib/utils';
import type { BlogBodySegment } from '@/types/blog';

const TYPOGRAPHY = [
    '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-h2',
    '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:scroll-mt-24 [&_h3]:text-h3',
    '[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-h4',
    '[&_p]:my-4 [&_p]:text-body-lg',
    '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1',
    '[&_a]:text-primary-text [&_a]:underline [&_a]:underline-offset-2',
    '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
    '[&_figure]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-panel',
    '[&_figcaption]:mt-2 [&_figcaption]:text-body-sm [&_figcaption]:text-muted-foreground',
].join(' ');

/**
 * Renders the post body as a run of segments. `html` segments are trusted only because the server
 * produces them with `RenderBlogBody` (CommonMark with raw HTML stripped, unsafe links and
 * non-`blog-image:` images dropped); never pass user-supplied or Markdown text here. Product
 * segments render outside the prose styles so the article typography does not leak into the card.
 */
export function BlogBody({
    segments,
    list,
    className,
}: {
    segments: BlogBodySegment[];
    /** The GA4 item list that product clicks are attributed to, e.g. `blog:{slug}`. */
    list?: BlogProductList;
    className?: string;
}) {
    return (
        <div className={className}>
            {segments.map((segment, index) =>
                segment.type === 'html' ? (
                    <div
                        key={index}
                        className={cn('max-w-prose', TYPOGRAPHY)}
                        dangerouslySetInnerHTML={{ __html: segment.html }}
                    />
                ) : (
                    <BlogProductCard
                        key={index}
                        product={segment.product}
                        list={list}
                        index={index}
                    />
                ),
            )}
        </div>
    );
}
