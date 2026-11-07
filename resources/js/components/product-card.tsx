import { Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { HalalBadge } from '@/components/halal-badge';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { SoldCount } from '@/components/sold-count';
import { DsIcon } from '@/components/ds-icon';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { HandlingTemp, ProductCardData } from '@/types/catalogue';
import { store as cartStore } from '@/routes/cart';
import { show as productShow } from '@/routes/products';

const ring = 'focus-ring';

/** Categories that never need certification: no halal badge is shown for them. */
const UNCERTIFIED_CATEGORIES = new Set([
    'prayer-essentials',
    'modest-fashion',
    'books-quran',
]);

const TEMP_LABEL: Record<HandlingTemp, string> = {
    frozen: 'Frozen',
    chilled: 'Chilled',
};

function discountPct(p: ProductCardData) {
    return p.was_price ? Math.round((1 - p.price / p.was_price) * 100) : 0;
}

function showHalalBadge(p: ProductCardData) {
    return (
        p.halal_status === 'certified' &&
        !UNCERTIFIED_CATEGORIES.has(p.category_slug ?? '')
    );
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
            {p.temperature && (
                <Badge variant="info" className="ml-auto shrink-0">
                    <DsIcon name="snowflake" className="size-3.5" />
                    {TEMP_LABEL[p.temperature]}
                </Badge>
            )}
        </p>
    );
}

/** -NN% promo tag: the only carrier of the discount on the card. */
function OffBadge({ p }: { p: ProductCardData }) {
    if (!p.was_price || p.in_stock === false) {
        return null;
    }

    return (
        <Badge
            variant="promo-solid"
            className="absolute top-0 right-0 rounded-none rounded-bl-tile"
        >
            <span className="sr-only">Discount </span>-{discountPct(p)}%
        </Badge>
    );
}

/** Dimmed media + Sold out tag when the product is unavailable. */
function CardMedia({
    p,
    index,
}: {
    p: ProductCardData;
    index: number;
}) {
    return (
        <>
            <Media
                label={p.name}
                icon={p.icon}
                src={p.image_url}
                index={index}
                decorative
                className={cn(p.in_stock === false && 'opacity-60')}
            />
            {p.in_stock === false && (
                <Badge
                    variant="neutral"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                    Sold out
                </Badge>
            )}
        </>
    );
}

function QuickAdd({ p }: { p: ProductCardData }) {
    const { auth } = usePage().props;

    if (p.in_stock === false) {
        return null;
    }

    return (
        <button
            type="button"
            aria-label={`Add ${p.name} to cart`}
            onClick={(e) => {
                e.preventDefault();
                if (!auth.user) {
                    router.visit('/login');
                    return;
                }
                router.post(
                    cartStore.url(),
                    { product_id: p.id, qty: 1 },
                    {
                        preserveScroll: true,
                        onSuccess: () => toast.success('Added to cart.'),
                        onError: () =>
                            toast.error(
                                'This item could not be added to your cart.',
                            ),
                    },
                );
            }}
            className="btn btn-secondary btn-icon btn-sm relative z-10 ml-auto shrink-0"
        >
            <ShoppingCart aria-hidden="true" />
        </button>
    );
}

type ProductCardProps = {
    product: ProductCardData;
    variant?: 'grid' | 'list' | 'compact';
    index?: number;
    quickAdd?: boolean;
};

/** Whole card is one link (stretched title link). */
export function ProductCard({
    product: p,
    variant = 'grid',
    index = 0,
    quickAdd = true,
}: ProductCardProps) {
    const { name } = usePage().props;
    const href = productShow.url(p.slug);
    const halalLabel = `Halal certified, verified by ${name}`;

    if (variant === 'list') {
        return (
            <article
                className={cn(
                    'card card-interactive relative flex gap-3 p-2',
                    ring,
                )}
            >
                <div className="relative w-28 shrink-0 overflow-hidden rounded-tile md:w-36">
                    <CardMedia p={p} index={index} />
                    <OffBadge p={p} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                    <h3 className="line-clamp-2 text-body" title={p.name}>
                        <Link
                            href={href}
                            className="after:absolute after:inset-0"
                        >
                            {p.name}
                        </Link>
                    </h3>
                    {showHalalBadge(p) && (
                        <p>
                            <HalalBadge
                                status="certified"
                                short
                                body={p.certifier}
                                aria-label={halalLabel}
                            />
                        </p>
                    )}
                    {p.in_stock === false ? (
                        <p
                            data-price
                            className="text-body text-muted-foreground"
                        >
                            {formatPeso(p.price)}
                        </p>
                    ) : (
                        <PriceBlock
                            price={p.price}
                            was={p.was_price}
                            pctBadge={false}
                        />
                    )}
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
                    <CardMedia p={p} index={index} />
                    <OffBadge p={p} />
                </div>
                <div className="grid gap-0.5 p-2">
                    <h3 className="truncate text-body-sm" title={p.name}>
                        <Link
                            href={href}
                            className="after:absolute after:inset-0"
                        >
                            {p.name}
                        </Link>
                    </h3>
                    {p.in_stock === false ? (
                        <p
                            data-price
                            className="text-body-sm text-muted-foreground"
                        >
                            {formatPeso(p.price)}
                        </p>
                    ) : (
                        <PriceBlock price={p.price} size="sm" />
                    )}
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
                <CardMedia p={p} index={index} />
                <OffBadge p={p} />
                {showHalalBadge(p) && (
                    <HalalBadge
                        status="certified"
                        short
                        solid
                        body={p.certifier}
                        aria-label={halalLabel}
                        className="absolute top-1.5 left-1.5"
                    />
                )}
                {p.in_stock !== false && p.free_shipping && (
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
                <h3
                    className="line-clamp-2 min-h-[2lh] text-body"
                    title={p.name}
                >
                    <Link
                        href={href}
                        className="after:absolute after:inset-0"
                    >
                        {p.name}
                    </Link>
                </h3>
                <div className="mt-auto grid gap-1">
                    {p.in_stock === false ? (
                        <p
                            data-price
                            className="text-body text-muted-foreground"
                        >
                            {formatPeso(p.price)}
                        </p>
                    ) : (
                        <div className="flex items-center gap-2">
                            <PriceBlock
                                price={p.price}
                                was={p.was_price}
                                pctBadge={false}
                                className="min-w-0 flex-1"
                            />
                            {quickAdd && <QuickAdd p={p} />}
                        </div>
                    )}
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
