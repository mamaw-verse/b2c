import { Check, Link as LinkIcon, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClipboard } from '@/hooks/use-clipboard';
import { getCsrfHeaders } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ShareButtonsProps {
    url: string;
    title: string;
    price?: number;
    text?: string;
    count?: number | null;
    enabled?: boolean;
    slug?: string;
    /**
     * Whether shares are reported to the product share endpoint. Turn off for anything that is not
     * a product (e.g. a blog post), which has no such endpoint.
     */
    track?: boolean;
    /** Accessible name of the share group and buttons. */
    label?: string;
    className?: string;
}

export function ShareButtons({
    url,
    title,
    price,
    text,
    count,
    enabled = true,
    slug,
    track = true,
    label = 'Share this product',
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
        if (!track) {
            return;
        }

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

    const formattedPrice =
        price !== undefined
            ? `₱${Number(price).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })}`
            : null;

    const shareBody = formattedPrice
        ? `${title} (${formattedPrice})`
        : (text ?? title);

    const handleNativeShare = () => {
        if (typeof navigator?.share !== 'function') {
            return;
        }

        navigator
            .share({
                title,
                text: shareBody,
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
    const encodedText = encodeURIComponent(shareBody);

    const messengerUrl = isCoarsePointer
        ? `fb-messenger://share/?link=${encodedUrl}`
        : `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`;

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    const xUrl = `https://x.com/intent/post?url=${encodedUrl}&text=${encodedText}`;

    const renderMessengerIcon = (cls = 'size-[18px] shrink-0') => (
        <svg
            className={cls}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.737 7.21V22l3.39-1.86c.905.251 1.868.388 2.873.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.73-2.91-5.326 2.91 5.856-6.218 2.796 2.91 5.26-2.91-5.856 6.218z" />
        </svg>
    );

    const renderFacebookIcon = (cls = 'size-[18px] shrink-0') => (
        <svg
            className={cls}
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
    );

    const renderXIcon = (cls = 'size-[18px] shrink-0') => (
        <svg
            className={cls}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );

    const ghostBtnCls =
        'inline-flex size-9 min-h-touch-target min-w-touch-target sm:min-h-9 sm:min-w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

    return (
        <div
            role="group"
            aria-label={label}
            className={cn('flex items-center gap-1.5', className)}
        >
            {/* Small screen (< 768px): collapsed Share button */}
            <div className="flex md:hidden">
                {canNativeShare ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleNativeShare}
                        className="min-h-touch-target gap-1.5 rounded-full px-3 py-2 text-body-sm text-muted-foreground hover:text-foreground"
                        aria-label={label}
                    >
                        <Share2
                            className="size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>Share</span>
                    </Button>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="min-h-touch-target gap-1.5 rounded-full px-3 py-2 text-body-sm text-muted-foreground hover:text-foreground"
                                aria-label={label}
                            >
                                <Share2
                                    className="size-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>Share</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                                onClick={handleCopy}
                                className="gap-2.5"
                            >
                                {copied ? (
                                    <Check
                                        className="size-4 shrink-0 text-success-text"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <LinkIcon
                                        className="size-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                )}
                                <span>Copy link</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a
                                    href={messengerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackShare('messenger')}
                                    className="flex items-center gap-2.5"
                                >
                                    {renderMessengerIcon('size-4 shrink-0')}
                                    <span>Messenger</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a
                                    href={facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackShare('facebook')}
                                    className="flex items-center gap-2.5"
                                >
                                    {renderFacebookIcon('size-4 shrink-0')}
                                    <span>Facebook</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a
                                    href={xUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackShare('x')}
                                    className="flex items-center gap-2.5"
                                >
                                    {renderXIcon('size-4 shrink-0')}
                                    <span>X</span>
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Medium and large screens (md+): inline compact Share group */}
            <div className="hidden items-center gap-1 md:flex">
                <span className="me-1 text-body-sm font-medium text-muted-foreground">
                    Share
                </span>

                {/* 1. Copy link */}
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy link"
                    title="Copy link"
                    className={ghostBtnCls}
                >
                    {copied ? (
                        <Check
                            className="size-[18px] shrink-0 text-success-text"
                            aria-hidden="true"
                        />
                    ) : (
                        <LinkIcon
                            className="size-[18px] shrink-0"
                            aria-hidden="true"
                        />
                    )}
                </button>

                {/* 2. Messenger */}
                <a
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShare('messenger')}
                    aria-label="Share on Messenger"
                    title="Share on Messenger"
                    className={ghostBtnCls}
                >
                    {renderMessengerIcon()}
                </a>

                {/* 3. Facebook */}
                <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShare('facebook')}
                    aria-label="Share on Facebook"
                    title="Share on Facebook"
                    className={ghostBtnCls}
                >
                    {renderFacebookIcon()}
                </a>

                {/* 4. X */}
                <a
                    href={xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShare('x')}
                    aria-label="Share on X"
                    title="Share on X"
                    className={ghostBtnCls}
                >
                    {renderXIcon()}
                </a>
            </div>

            {/* Public share count */}
            {count !== null && count !== undefined && (
                <span className="ms-1 text-caption whitespace-nowrap text-muted-foreground">
                    {count} {count === 1 ? 'share' : 'shares'}
                </span>
            )}
        </div>
    );
}
