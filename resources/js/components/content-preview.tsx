import { FileBadge, Flag } from 'lucide-react';
import { Rating } from '@/components/rating';
import { PriceBlock } from '@/components/price-block';

export type ProductSnapshot = {
    title: string;
    price: number | string;
    original_price?: number | string;
    seller_name?: string;
    seller_href?: string;
    seller_joined?: string;
    seller_warnings?: number;
    photos?: string[];
    flag_notice?: string;
    halal_status?: string;
    halal_badge_class?: string;
    ingredients?: string;
    flagged_terms?: string[];
};

export type ReviewSnapshot = {
    rating: number;
    text: string;
    author: string;
    order_ref?: string;
    date?: string;
    flagged_terms?: string[];
};

export type ChatMessage = {
    id?: string;
    sender: 'buyer' | 'seller' | 'system';
    sender_label?: string;
    text: string;
    reported?: boolean;
    created_at?: string;
};

export type ChatSnapshot = {
    messages: ChatMessage[];
    hidden_earlier_count?: number;
    hidden_later_count?: number;
};

export type ContentPreviewProps = {
    kind: 'product' | 'review' | 'chat';
    snapshot:
        | ProductSnapshot
        | ReviewSnapshot
        | ChatSnapshot
        | Record<string, unknown>;
};

function highlightTerms(text: string, terms: string[] = []) {
    if (!terms.length) {
        return text;
    }
    const regex = new RegExp(
        `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
        'gi',
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
            <mark
                key={i}
                className="rounded-badge bg-mod-flagged-bg px-1 font-bold text-mod-flagged"
            >
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

export function ContentPreview({ kind, snapshot }: ContentPreviewProps) {
    if (kind === 'product') {
        const data = snapshot as ProductSnapshot;
        return (
            <div className="grid gap-3">
                {data.photos && data.photos.length > 0 && (
                    <ul className="flex gap-2" aria-label="Listing photos">
                        {data.photos.map((src, i) => (
                            <li
                                key={i}
                                className="w-16 shrink-0 overflow-hidden rounded-tile"
                            >
                                <img
                                    src={src}
                                    alt={`Listing photo ${i + 1}`}
                                    className="aspect-square size-full object-cover"
                                />
                            </li>
                        ))}
                    </ul>
                )}

                <div className="grid content-start gap-2">
                    <p className="text-h4">{data.title}</p>
                    {data.price !== undefined && (
                        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                            <PriceBlock price={Number(data.price)} />
                        </p>
                    )}
                    {(data.seller_name || data.seller_joined) && (
                        <p className="text-body-sm text-muted-foreground">
                            {data.seller_name && (
                                <>
                                    Seller:{' '}
                                    {data.seller_href ? (
                                        <a
                                            href={data.seller_href}
                                            className="font-bold text-primary underline"
                                        >
                                            {data.seller_name}
                                        </a>
                                    ) : (
                                        <span className="font-bold text-foreground">
                                            {data.seller_name}
                                        </span>
                                    )}
                                </>
                            )}
                            {data.seller_joined &&
                                ` · joined ${data.seller_joined}`}
                            {data.seller_warnings !== undefined &&
                                ` · ${data.seller_warnings} prior warning${data.seller_warnings === 1 ? '' : 's'}`}
                        </p>
                    )}

                    {data.flag_notice && (
                        <p className="rounded-tile bg-mod-flagged-bg p-2 text-body-sm text-mod-flagged">
                            {data.flag_notice}
                        </p>
                    )}

                    <dl className="grid gap-1 text-body-sm">
                        {data.halal_status && (
                            <div className="grid grid-cols-[7rem_1fr] gap-3">
                                <dt className="text-muted-foreground">
                                    Halal status
                                </dt>
                                <dd>
                                    <span
                                        className={
                                            data.halal_badge_class ??
                                            'badge badge-danger'
                                        }
                                    >
                                        <FileBadge
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        {data.halal_status}
                                    </span>
                                </dd>
                            </div>
                        )}
                        {data.ingredients && (
                            <div className="grid grid-cols-[7rem_1fr] gap-3">
                                <dt className="text-muted-foreground">
                                    Ingredients
                                </dt>
                                <dd className="text-foreground">
                                    {highlightTerms(
                                        data.ingredients,
                                        data.flagged_terms ?? [
                                            'pork fat',
                                            'pork',
                                            'lard',
                                            'alcohol',
                                        ],
                                    )}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        );
    }

    if (kind === 'review') {
        const data = snapshot as ReviewSnapshot;
        return (
            <div className="grid gap-2">
                <Rating value={data.rating} size="size-4" />
                <p className="text-body">
                    {highlightTerms(
                        data.text,
                        data.flagged_terms ?? [
                            '[phone number removed]',
                            '[account no. masked]',
                        ],
                    )}
                </p>
                <p className="text-body-sm text-muted-foreground">
                    by {data.author}
                    {data.order_ref && ` · Order #${data.order_ref}`}
                    {data.date && ` · ${data.date}`}
                </p>
            </div>
        );
    }

    if (kind === 'chat') {
        const data = snapshot as ChatSnapshot;
        const messages = data.messages ?? [];
        return (
            <div className="grid gap-2 rounded-panel bg-background p-3">
                {!!data.hidden_earlier_count && (
                    <p className="text-center text-caption text-muted-foreground">
                        {data.hidden_earlier_count} earlier messages hidden ·
                        context only
                    </p>
                )}
                <ol className="grid gap-2" aria-label="Chat excerpt">
                    {messages.map((msg, i) => {
                        const isReported = msg.reported;
                        const isSeller = msg.sender === 'seller';
                        return (
                            <li
                                key={msg.id ?? i}
                                className={`rounded-panel px-3 py-2 text-body ${
                                    isSeller
                                        ? 'ml-auto max-w-[85%]'
                                        : 'max-w-[85%]'
                                } ${
                                    isReported
                                        ? 'border-2 border-mod-flagged bg-mod-flagged-bg text-foreground'
                                        : 'border border-border bg-surface'
                                }`}
                            >
                                {isReported && (
                                    <span className="mb-1 flex items-center gap-1 text-caption font-bold text-mod-flagged">
                                        <Flag
                                            aria-hidden="true"
                                            className="size-3.5"
                                        />
                                        Reported message
                                    </span>
                                )}
                                <span className="sr-only">
                                    {msg.sender_label ??
                                        (isSeller ? 'Seller: ' : 'Buyer: ')}
                                </span>
                                {msg.text}
                            </li>
                        );
                    })}
                </ol>
                {!!data.hidden_later_count && (
                    <p className="text-center text-caption text-muted-foreground">
                        {data.hidden_later_count} later messages hidden
                    </p>
                )}
            </div>
        );
    }

    return (
        <p className="text-body-sm text-muted-foreground">
            Snapshot content preview not available for this type.
        </p>
    );
}
