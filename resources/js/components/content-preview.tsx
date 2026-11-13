import { Flag } from 'lucide-react';
import { HalalBadge } from '@/components/halal-badge';
import { Rating } from '@/components/rating';
import { PriceBlock } from '@/components/price-block';
import { StatusPill } from '@/components/status-pill';
import type { HalalStatus } from '@/types/catalogue';

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

export type ShopCertificateSnapshot = {
    certifying_body?: string;
    number?: string;
    valid_until?: string;
    status?: 'certified' | 'expiring' | 'expired';
    document_url?: string | null;
};

export type ShopApplicationSnapshot = {
    shop_name: string;
    description?: string;
    logo_url?: string;
    address_line?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    halal_only?: boolean;
    business_permit_url?: string;
    certificates?: ShopCertificateSnapshot[];
    applicant_name?: string;
    applicant_email?: string;
    submitted_at?: string;
    terms_version?: string;
    terms_accepted_at?: string;
    flag_notice?: string;
};

export type ContentPreviewProps = {
    kind: 'product' | 'review' | 'chat' | 'shop_application';
    snapshot:
        | ProductSnapshot
        | ReviewSnapshot
        | ChatSnapshot
        | ShopApplicationSnapshot
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
                                            className="font-bold text-primary-text underline"
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
                                    <HalalBadge
                                        status={
                                            data.halal_status as HalalStatus
                                        }
                                    />
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

    if (kind === 'shop_application') {
        const data = snapshot as ShopApplicationSnapshot;
        const address = [
            data.address_line,
            data.city,
            data.state,
            data.postal_code,
        ]
            .filter(Boolean)
            .join(', ');
        const documents = [
            {
                type: 'permit' as const,
                label: 'Business permit',
                url: data.business_permit_url,
            },
            ...(data.certificates ?? []).map((certificate, i) => ({
                type: 'certificate' as const,
                certificate,
                label: certificate.certifying_body ?? `Certificate ${i + 1}`,
                url: certificate.document_url,
            })),
        ];
        return (
            <div className="grid gap-3">
                {data.flag_notice && (
                    <div className="flex items-start gap-2 rounded-tile bg-mod-flagged-bg p-3 text-body-sm text-mod-flagged">
                        <Flag
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        <p>{data.flag_notice}</p>
                    </div>
                )}

                <section
                    className="grid gap-3"
                    aria-labelledby="shop-applicant"
                >
                    <h3
                        id="shop-applicant"
                        className="text-label text-foreground"
                    >
                        Applicant
                    </h3>
                    <div className="flex items-center gap-3">
                        {data.logo_url && (
                            <img
                                src={data.logo_url}
                                alt={`${data.shop_name} logo`}
                                className="size-14 shrink-0 rounded-tile border border-border object-cover"
                            />
                        )}
                        <div className="grid gap-0.5">
                            <p className="text-h4">{data.shop_name}</p>
                            {data.applicant_name && (
                                <p className="text-body-sm text-foreground">
                                    {data.applicant_name}
                                </p>
                            )}
                            {data.applicant_email && (
                                <p className="text-body-sm text-muted-foreground">
                                    {data.applicant_email}
                                </p>
                            )}
                        </div>
                    </div>
                    {data.submitted_at && (
                        <p className="text-body-sm text-muted-foreground">
                            Submitted{' '}
                            <time>
                                {new Date(data.submitted_at).toLocaleString(
                                    'en-PH',
                                    {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    },
                                )}
                            </time>
                        </p>
                    )}
                </section>

                <section className="grid gap-3" aria-labelledby="shop-details">
                    <h3
                        id="shop-details"
                        className="text-label text-foreground"
                    >
                        Shop details
                    </h3>
                    <dl className="grid gap-2 text-body-sm">
                        {data.description && (
                            <div className="grid grid-cols-[minmax(7rem,35%)_1fr] gap-3">
                                <dt className="text-muted-foreground">
                                    Description
                                </dt>
                                <dd className="whitespace-pre-wrap text-foreground">
                                    {data.description}
                                </dd>
                            </div>
                        )}
                        {address && (
                            <div className="grid grid-cols-[minmax(7rem,35%)_1fr] gap-3">
                                <dt className="text-muted-foreground">
                                    Address
                                </dt>
                                <dd className="text-foreground">{address}</dd>
                            </div>
                        )}
                        {data.halal_only !== undefined && (
                            <div className="grid grid-cols-[minmax(7rem,35%)_1fr] gap-3">
                                <dt className="text-muted-foreground">
                                    Halal-only
                                </dt>
                                <dd className="text-foreground">
                                    {data.halal_only ? 'Yes' : 'No'}
                                </dd>
                            </div>
                        )}
                        {(data.terms_version || data.terms_accepted_at) && (
                            <div className="grid grid-cols-[minmax(7rem,35%)_1fr] gap-3">
                                <dt className="text-muted-foreground">
                                    Seller terms
                                </dt>
                                <dd className="text-foreground">
                                    {data.terms_version
                                        ? `Version ${data.terms_version}`
                                        : 'Accepted'}
                                    {data.terms_accepted_at && (
                                        <>
                                            {' · '}
                                            {new Date(
                                                data.terms_accepted_at,
                                            ).toLocaleDateString('en-PH', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </>
                                    )}
                                </dd>
                            </div>
                        )}
                    </dl>
                </section>

                <section
                    className="grid gap-3"
                    aria-labelledby="shop-documents"
                >
                    <h3
                        id="shop-documents"
                        className="text-label text-foreground"
                    >
                        Documents
                    </h3>
                    <ul
                        className="grid gap-2"
                        aria-label="Application documents"
                    >
                        {documents.map((document, index) => (
                            <li
                                key={`${document.type}-${index}`}
                                className="grid gap-2 rounded-field border border-border bg-surface p-3"
                            >
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="font-bold text-foreground">
                                        {document.type === 'certificate'
                                            ? `${document.label}${document.certificate?.number ? ` · No. ${document.certificate.number}` : ''}`
                                            : document.label}
                                    </p>
                                    {document.url ? (
                                        <a
                                            href={document.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                                        >
                                            {document.type === 'permit'
                                                ? 'View'
                                                : 'View file'}
                                        </a>
                                    ) : (
                                        <span className="text-body-sm text-muted-foreground">
                                            No file provided
                                        </span>
                                    )}
                                </div>
                                {document.type === 'certificate' &&
                                    document.certificate?.valid_until && (
                                        <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
                                            <span>
                                                Valid until{' '}
                                                {new Date(
                                                    document.certificate
                                                        .valid_until,
                                                ).toLocaleDateString('en-PH', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                            {document.certificate.status && (
                                                <StatusPill
                                                    state={
                                                        document.certificate
                                                            .status
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}
                            </li>
                        ))}
                        {documents.length === 0 && (
                            <li className="text-body-sm text-muted-foreground">
                                No documents provided.
                            </li>
                        )}
                    </ul>
                </section>
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
