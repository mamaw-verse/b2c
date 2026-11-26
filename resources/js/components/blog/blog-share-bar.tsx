import { ShareButtons } from '@/components/share-buttons';

/**
 * Share bar for a post: copy link, native share on touch devices, Messenger, Facebook and X.
 * It reuses the storefront share control with tracking switched off, so a blog page never calls
 * the product share endpoint (plan §6.4).
 */
export function BlogShareBar({
    url,
    title,
    className,
}: {
    url: string;
    title: string;
    className?: string;
}) {
    return (
        <ShareButtons
            url={url}
            title={title}
            track={false}
            label="Share this article"
            className={className}
        />
    );
}
