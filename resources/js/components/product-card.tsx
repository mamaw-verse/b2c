import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { HalalBadge } from '@/components/halal-badge';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { SoldCount } from '@/components/sold-count';
import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/types/catalogue';
import { show as productShow } from '@/routes/products';

const ring =
    'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring';

function discountPct(p: ProductCardData) {
    return p.was_price ? Math.round((1 - p.price / p.was_price) * 100) : 0;
}

function Meta({ p }: { p: ProductCardData }) {
    return (
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <DsIcon
                name="star"
                className="size-3.5 fill-current stroke-0 text-rating"
            />
            <span className="sr-only">Rated</span>
            <span className="tabular font-bold text-foreground">
                {p.rating.toFixed(1)}
            </span>
            <span aria-hidden="true">·</span>
            <SoldCount count={p.sold_count} />
        </p>
    );
}

function Loc({ p }: { p: ProductCardData }) {
    return (
        <p className="flex min-w-0 items-center gap-1 text-caption text-muted-foreground">
            <DsIcon name="map-pin" className="size-3.5 shrink-0" />
            <span className="truncate">{p.location}</span>
            {p.frozen && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 pl-1 text-info">
                    <DsIcon name="snowflake" className="size-3.5" />
                    Frozen
                </span>
            )}
        </p>
    );
}

function OffBadge({ p }: { p: ProductCardData }) {
    if (!p.was_price) {
        return null;
    }

    return (
        <Badge
            variant="sale-solid"
            className="absolute top-0 right-0 rounded-none rounded-bl-tile"
        >
            <span className="sr-only">Discount </span>-{discountPct(p)}%
        </Badge>
    );
}

type ProductCardProps = {
    product: ProductCardData;
    variant?: 'grid' | 'list' | 'compact';
    index?: number;
};

/** Whole card is one link (stretched title link). */
export function ProductCard({
    product: p,
    variant = 'grid',
    index = 0,
}: ProductCardProps) {
    const href = productShow.url(p.slug);

    if (variant === 'list') {
        return (
            <article
                className={cn(
                    'card card-interactive relative flex gap-3 p-2',
                    ring,
                )}
            >
                <div className="relative w-28 shrink-0 overflow-hidden rounded-tile md:w-36">
                    <Media
                        label={p.name}
                        icon={p.icon}
                        src={p.image_url}
                        index={index}
                        decorative
                    />
                    <OffBadge p={p} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                    <h3 className="line-clamp-2 text-body">
                        <Link
                            href={href}
                            className="after:absolute after:inset-0 focus-visible:outline-none"
                        >
                            {p.name}
                        </Link>
                    </h3>
                    {p.halal_status === 'certified' && (
                        <p>
                            <HalalBadge
                                status="certified"
                                short
                                body={p.certifier}
                            />
                        </p>
                    )}
                    <PriceBlock
                        price={p.price}
                        was={p.was_price}
                        pctBadge={false}
                    />
                    <Meta p={p} />
                    <Loc p={p} />
                </div>
            </article>
        );
    }

    if (variant === 'compact') {
        return (
            <article
                className={cn(
                    'card card-interactive relative flex w-32 shrink-0 flex-col overflow-hidden',
                    ring,
                )}
            >
                <div className="relative">
                    <Media
                        label={p.name}
                        icon={p.icon}
                        src={p.image_url}
                        index={index}
                        decorative
                    />
                    <OffBadge p={p} />
                </div>
                <div className="grid gap-0.5 p-2">
                    <h3 className="truncate text-body-sm">
                        <Link
                            href={href}
                            className="after:absolute after:inset-0 focus-visible:outline-none"
                        >
                            {p.name}
                        </Link>
                    </h3>
                    <PriceBlock price={p.price} size="sm" />
                </div>
            </article>
        );
    }

    return (
        <article
            className={cn(
                'card card-interactive relative flex w-full flex-col overflow-hidden',
                ring,
            )}
        >
            <div className="relative">
                <Media
                    label={p.name}
                    icon={p.icon}
                    src={p.image_url}
                    index={index}
                    decorative
                />
                <OffBadge p={p} />
                {p.halal_status === 'certified' && (
                    <HalalBadge
                        status="certified"
                        short
                        solid
                        body={p.certifier}
                        className="absolute top-1.5 left-1.5"
                    />
                )}
                {p.free_shipping && (
                    <Badge
                        variant="success"
                        className="absolute bottom-1.5 left-1.5"
                    >
                        <DsIcon name="truck" className="size-3.5" />
                        Free shipping
                    </Badge>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-2">
                <h3 className="line-clamp-2 min-h-[2lh] text-body">
                    <Link
                        href={href}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                        {p.name}
                    </Link>
                </h3>
                <div className="mt-auto grid gap-1">
                    <PriceBlock
                        price={p.price}
                        was={p.was_price}
                        pctBadge={false}
                    />
                    <Meta p={p} />
                    <Loc p={p} />
                </div>
            </div>
        </article>
    );
}

export function ProductGrid({
    products,
    id,
    className,
}: {
    products: ProductCardData[];
    id?: string;
    className?: string;
}) {
    return (
        <ul
            id={id}
            className={cn(
                'grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-5',
                className,
            )}
        >
            {products.map((p, i) => (
                <li key={p.id} className="flex">
                    <ProductCard product={p} index={i} />
                </li>
            ))}
        </ul>
    );
}
