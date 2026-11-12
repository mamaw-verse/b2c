import { Link } from '@inertiajs/react';
import { Check, Copy, ExternalLink, MapPin } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

export type FulfillmentLine = {
    name: string;
    href?: string;
    variation?: string | null;
    sku?: string | null;
    thumbnail?: string | null;
    thumbnail_icon?: string | null;
    unit_price: number;
    quantity: number;
};

export type FulfillmentTracking = {
    courier?: string | null;
    number?: string | null;
    url?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
};

export type FulfillmentCardProps = {
    title: string;
    badge: {
        label: string;
        tone?:
            | 'yellow'
            | 'green'
            | 'blue'
            | 'neutral'
            | 'warning'
            | 'success'
            | 'info';
    };
    location?: string | null;
    lines: FulfillmentLine[];
    tracking?: FulfillmentTracking | null;
    footer?: ReactNode;
    menu?: ReactNode;
    className?: string;
    'data-test'?: string;
};

export function FulfillmentCard({
    title,
    badge,
    location,
    lines,
    tracking,
    footer,
    menu,
    className,
    'data-test': dataTest,
}: FulfillmentCardProps) {
    const [copied, setCopied] = useState(false);

    const mapToneToVariant = (tone?: string) => {
        switch (tone) {
            case 'yellow':
            case 'warning':
                return 'warning';
            case 'green':
            case 'success':
                return 'success';
            case 'blue':
            case 'info':
                return 'info';
            case 'neutral':
            default:
                return 'neutral';
        }
    };

    const handleCopy = (text: string) => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section
            className={cn('panel overflow-hidden p-4 md:p-6', className)}
            data-test={dataTest}
        >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-h3">{title}</h3>
                        <Badge variant={mapToneToVariant(badge.tone)}>
                            {badge.label}
                        </Badge>
                    </div>

                    {location && (
                        <p className="mt-1 flex items-center gap-1 text-body-sm text-muted-foreground">
                            <MapPin
                                className="size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <span>{location}</span>
                        </p>
                    )}

                    {tracking && (
                        <div className="mt-2 text-body-sm text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-2">
                                <span>
                                    {tracking.courier &&
                                        `${tracking.courier} · `}
                                    {tracking.number &&
                                        `Tracking: ${tracking.number}`}
                                </span>

                                {tracking.url ? (
                                    <a
                                        href={tracking.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-label text-halal hover:underline"
                                    >
                                        Track parcel
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </a>
                                ) : tracking.number ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCopy(tracking.number!)
                                        }
                                        className="inline-flex items-center gap-1 text-body-sm text-halal hover:underline"
                                        aria-label="Copy tracking number"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="size-3.5" />
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3.5" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                ) : null}
                            </div>

                            <p className="mt-0.5 text-caption">
                                {tracking.shipped_at &&
                                    `Shipped ${formatDateTime(tracking.shipped_at)}`}
                                {tracking.delivered_at &&
                                    ` · Delivered ${formatDateTime(tracking.delivered_at)}`}
                            </p>
                        </div>
                    )}
                </div>

                {menu && <div className="shrink-0">{menu}</div>}
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto py-3">
                <table className="w-full text-body">
                    <caption className="sr-only">Fulfilled items</caption>
                    <thead className="hidden border-b border-border text-left text-label text-muted-foreground md:table-header-group">
                        <tr>
                            <th scope="col" className="py-2 pr-4 font-medium">
                                Product
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-2 text-end font-medium"
                            >
                                Price × Qty
                            </th>
                            <th
                                scope="col"
                                className="py-2 pl-4 text-end font-medium"
                            >
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {lines.map((line, idx) => (
                            <tr
                                key={idx}
                                className="flex flex-col py-3 md:table-row md:py-0"
                            >
                                <td className="py-2 md:pr-4">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-surface-raised grid size-12 shrink-0 place-items-center rounded-tile text-muted-foreground">
                                            {line.thumbnail ? (
                                                <img
                                                    src={line.thumbnail}
                                                    alt={line.name}
                                                    className="size-12 rounded-tile object-cover"
                                                />
                                            ) : (
                                                <DsIcon
                                                    name={
                                                        line.thumbnail_icon ??
                                                        'package'
                                                    }
                                                    className="size-5"
                                                />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            {line.href ? (
                                                <Link
                                                    href={line.href}
                                                    className="truncate text-label font-medium hover:underline"
                                                >
                                                    {line.name}
                                                </Link>
                                            ) : (
                                                <p className="truncate text-label font-medium">
                                                    {line.name}
                                                </p>
                                            )}
                                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                                {line.variation && (
                                                    <span className="rounded-badge bg-surface-subtle px-1.5 py-0.5 text-caption text-muted-foreground">
                                                        {line.variation}
                                                    </span>
                                                )}
                                                {line.sku && (
                                                    <span className="text-caption text-muted-foreground">
                                                        SKU: {line.sku}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="flex justify-between py-1 text-body-sm md:table-cell md:px-4 md:py-2 md:text-end">
                                    <span className="text-muted-foreground md:hidden">
                                        Price × Qty
                                    </span>
                                    <span>
                                        {formatPeso(line.unit_price)} ×{' '}
                                        {line.quantity}
                                    </span>
                                </td>
                                <td className="flex justify-between py-1 text-label font-medium md:table-cell md:py-2 md:pl-4 md:text-end">
                                    <span className="text-muted-foreground md:hidden">
                                        Total
                                    </span>
                                    <span>
                                        {formatPeso(
                                            line.unit_price * line.quantity,
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {footer && (
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                    {footer}
                </div>
            )}
        </section>
    );
}
