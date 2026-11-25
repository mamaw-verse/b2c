import { cn } from "@/lib/utils";

const TYPOGRAPHY = [
    "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-h2",
    "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:scroll-mt-24 [&_h3]:text-h3",
    "[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-h4",
    "[&_p]:my-4 [&_p]:text-body-lg",
    "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
    "[&_a]:text-primary-text [&_a]:underline [&_a]:underline-offset-2",
    "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
    "[&_figure]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-panel",
    "[&_figcaption]:mt-2 [&_figcaption]:text-body-sm [&_figcaption]:text-muted-foreground",
    // Product embed markers are filled in by B2.5; until then an empty marker takes no space.
    "[&_[data-blog-product]:empty]:hidden",
].join(" ");

/**
 * Renders the post body. `html` is trusted only because the server produces it with `RenderBlogBody`
 * (CommonMark with raw HTML stripped, unsafe links and non-`blog-image:` images dropped). Never pass
 * user-supplied or Markdown text here.
 */
export function BlogBody({ html, className }: { html: string; className?: string }) {
    return (
        <div
            className={cn("max-w-prose", TYPOGRAPHY, className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
