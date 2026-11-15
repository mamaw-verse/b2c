import { Check, Link as LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { getCsrfHeaders } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ShareButtonsProps {
    url: string;
    title: string;
    text?: string;
    count?: number | null;
    enabled?: boolean;
    slug?: string;
    className?: string;
}

export function ShareButtons({
    url,
    title,
    text,
    count,
    enabled = true,
    slug,
    className,
}: ShareButtonsProps) {
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);
    const [isCoarsePointer, setIsCoarsePointer] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        setIsCoarsePointer(window.matchMedia('(pointer: coarse)').matches);
        setCanNativeShare(
            typeof navigator !== 'undefined' &&
                typeof navigator.share === 'function',
        );
    }, []);

    if (!enabled) {
        return null;
    }

    const endpoint = slug
        ? `/products/${slug}/shares`
        : `${url.split('?')[0].replace(/\/+$/, '')}/shares`;

    const trackShare = (channel: string) => {
        fetch(endpoint, {
            method: 'POST',
            keepalive: true,
            headers: {
                ...getCsrfHeaders(),
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ channel }),
        }).catch(() => {
            // Silently swallow errors
        });
    };

    const fallbackCopy = (str: string): boolean => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = str;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            return successful;
        } catch {
            return false;
        }
    };

    const handleCopy = async () => {
        let isCopied = false;
        try {
            isCopied = await copy(url);
        } catch {
            isCopied = false;
        }

        if (!isCopied) {
            isCopied = fallbackCopy(url);
        }

        if (isCopied) {
            toast('Link copied');
            setCopied(true);
            trackShare('copy');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNativeShare = () => {
        if (typeof navigator?.share !== 'function') {
            return;
        }

        navigator
            .share({
                title,
                text: text ?? title,
                url,
            })
            .then(() => {
                trackShare('native');
            })
            .catch((err) => {
                if (err && err.name === 'AbortError') {
                    return;
                }
            });
    };

    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text ?? title);

    return (
        <div
            role="group"
            aria-label="Share this product"
            className={cn('flex flex-wrap items-center gap-2', className)}
        >
            <span className="text-caption font-semibold tracking-wider text-muted-foreground uppercase">
                Share:
            </span>

            {/* Copy link */}
            <Button
                type="button"
                variant="neutral"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy link"
                title="Copy link"
            >
                {copied ? (
                    <Check
                        className="size-4 shrink-0 text-success-text"
                        aria-hidden="true"
                    />
                ) : (
                    <LinkIcon className="size-4 shrink-0" aria-hidden="true" />
                )}
            </Button>

            {/* Facebook */}
            <Button variant="neutral" size="icon" asChild>
                <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShare('facebook')}
                    aria-label="Share on Facebook"
                    title="Share on Facebook"
                >
                    <svg
                        className="size-4 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                            clipRule="evenodd"
                        />
                    </svg>
                </a>
            </Button>

            {/* X */}
            <Button variant="neutral" size="icon" asChild>
                <a
                    href={`https://x.com/intent/post?url=${encodedUrl}&text=${encodedText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShare('x')}
                    aria-label="Share on X"
                    title="Share on X"
                >
                    <svg
                        className="size-4 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </a>
            </Button>

            {/* Messenger (touch devices only) */}
            {isCoarsePointer && (
                <Button variant="neutral" size="icon" asChild>
                    <a
                        href={`fb-messenger://share/?link=${encodedUrl}`}
                        onClick={() => trackShare('messenger')}
                        aria-label="Share on Messenger"
                        title="Share on Messenger"
                    >
                        <svg
                            className="size-4 shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.737 7.21V22l3.39-1.86c.905.251 1.868.388 2.873.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.73-2.91-5.326 2.91 5.856-6.218 2.796 2.91 5.26-2.91-5.856 6.218z" />
                        </svg>
                    </a>
                </Button>
            )}

            {/* Instagram (native share sheet) */}
            {canNativeShare && (
                <Button
                    type="button"
                    variant="neutral"
                    size="icon"
                    onClick={handleNativeShare}
                    aria-label="Share on Instagram"
                    title="Share via your phone's share sheet"
                >
                    <svg
                        className="size-4 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                            clipRule="evenodd"
                        />
                    </svg>
                </Button>
            )}

            {/* Public share count */}
            {count !== null && count !== undefined && (
                <span className="ms-1 text-body-sm whitespace-nowrap text-muted-foreground">
                    {count} {count === 1 ? 'share' : 'shares'}
                </span>
            )}
        </div>
    );
}
