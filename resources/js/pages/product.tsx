import { Head, Link, router, setLayoutProps, usePage } from '@inertiajs/react';
import { ChevronRight, Flag, MessageCircle, Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/breadcrumb';
import { Carousel } from '@/components/carousel';
import { ColdChainNote } from '@/components/cold-chain-note';
import { DsIcon } from '@/components/ds-icon';
import { HalalBadge } from '@/components/halal-badge';
import { HalalCertificateCard } from '@/components/halal-certificate-card';
import { HalalFacts } from '@/components/halal-facts';
import { KeyValueList } from '@/components/key-value-list';
import { PriceBlock } from '@/components/price-block';
import { ProductCard } from '@/components/product-card';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Rating } from '@/components/rating';
import { ReportDialog } from '@/components/report-dialog';
import { ReviewCard, type ReviewData } from '@/components/review-card';
import { ShopHeader } from '@/components/shop-header';
import { SoldCount } from '@/components/sold-count';
import { StickyActionBar } from '@/components/sticky-action-bar';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { VariationPicker } from '@/components/variation-picker';
import { home, login } from '@/routes';
import { show as categoryShow } from '@/routes/categories';
import { show as shopShow } from '@/routes/shops';
import type {
    ProductCardData,
    ProductDetail,
    ProductVariation,
} from '@/types/catalogue';

export default function Product({
    product: p,
    reviews = [],
    related = [],
}: {
    product: ProductDetail;
    reviews?: ReviewData[];
    related?: ProductCardData[];
}) {
    const { auth, seller, workspaces } = usePage().props;
    // The sticky action bar replaces the bottom tab bar on this page.
    setLayoutProps({ tabBar: false });
    const isOwnProduct = seller?.shop_id === p.shop.id;
    // Chat is a buyer surface — stripped for admins.
    const isAdmin = (workspaces ?? []).some((w) => w.key === 'admin');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [qty, setQty] = useState(1);

    const handleReportClick = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        setReportOpen(true);
    };
    const handleChatClick = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        router.post('/account/chat', {
            shop_id: p.shop.id,
            product_id: p.id,
        });
    };
    const [selectedVariation, setSelectedVariation] =
        useState<ProductVariation | null>(
            () =>
                p.variations.find((v) => v.stock > 0) ??
                p.variations[0] ??
                null,
        );
    const currentVariation = selectedVariation ?? p.variations[0] ?? null;
    const variationLabel = currentVariation
        ? `${currentVariation.option1_value}${currentVariation.option2_value ? ` · ${currentVariation.option2_value}` : ''}`
        : 'Default';
    const currentPrice = currentVariation?.price ?? p.price;
    const currentWasPrice = currentVariation
        ? (currentVariation.was_price ?? p.was_price)
        : p.was_price;
    const currentStock = currentVariation ? currentVariation.stock : p.stock;
    const inStock = currentStock > 0;
    const cert = p.certification;
    const certValid = cert
        ? new Date(cert.valid_until).toLocaleDateString('en-PH', {
              month: 'short',
              year: 'numeric',
          })
        : null;

    const addToCart = (
        variationId: string | null,
        qty: number,
        buyNow: boolean,
    ) => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        router.post(
            '/cart',
            {
                product_id: p.id,
                product_variation_id: variationId,
                qty,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (buyNow) {
                        router.visit('/checkout');
                    } else {
                        toast.success('Added to cart.');
                    }
                },
                onError: (errors) => {
                    toast.error(
                        errors.qty ??
                            errors.product ??
                            'This item could not be added to your cart.',
                    );
                },
            },
        );
    };

    const hasVariations = p.variations.length > 0;
    const buyAction = (buyNow: boolean) => {
        if (hasVariations) {
            setPickerOpen(true);
        } else {
            addToCart(null, qty, buyNow);
        }
    };

    const halalGuidance: Record<string, string> = {
        review: "The seller's certificate is under review — the claim is not verified yet.",
        expiring:
            'The certificate expires soon. We re-verify sellers before expiry.',
        expired:
            'The certificate has expired — the halal claim is not currently verified.',
        missing:
            'No certificate is on file for this product — the halal claim is not verified.',
    };

    return (
        <>
            <Head title={p.name} />
            <div>
                <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:pt-6">
                    <div>
                        <Carousel
                            slides={[
                                ...(p.video?.url
                                    ? [
                                          {
                                              label: `${p.name} video`,
                                              src: p.video.url,
                                              type: 'video' as const,
                                          },
                                      ]
                                    : []),
                                ...p.images.map((img, i) => ({
                                    label: `${p.name} photo ${i + 1}`,
                                    icon: img.icon,
                                    src: img.url,
                                    type: 'image' as const,
                                })),
                            ]}
                        />
                    </div>
                    <div className="grid content-start gap-5 pt-4 md:gap-6 md:pt-0">
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <Breadcrumb
                                    items={[
                                        { label: 'Home', href: home().url },
                                        {
                                            label: p.category.name,
                                            href: categoryShow.url(
                                                p.category.slug,
                                            ),
                                        },
                                    ]}
                                />
                                <button
                                    type="button"
                                    onClick={handleReportClick}
                                    className="hidden shrink-0 items-center gap-1 text-body-sm text-muted-foreground hover:text-foreground md:inline-flex"
                                >
                                    <Flag
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Report this product
                                </button>
                            </div>
                            <h1 className="mt-2 text-h1">{p.name}</h1>
                            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">
                                {p.review_count > 0 ? (
                                    <>
                                        <Rating
                                            value={p.rating}
                                            size="size-4"
                                        />
                                        <a
                                            href="#pd-rev"
                                            className="inline-flex min-h-touch items-center text-muted-foreground underline underline-offset-2"
                                        >
                                            {p.review_count === 1
                                                ? '1 rating'
                                                : `${p.review_count} ratings`}
                                        </a>
                                        <span
                                            aria-hidden="true"
                                            className="text-muted-foreground"
                                        >
                                            ·
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">
                                        No ratings yet
                                    </span>
                                )}
                                {p.sold_count > 0 && (
                                    <span className="text-muted-foreground">
                                        <SoldCount count={p.sold_count} />
                                    </span>
                                )}
                            </p>
                        </div>
                        {p.halal_status === 'certified' && (
                            <HalalFacts valid={certValid} frozen={p.frozen} />
                        )}
                        <div className="rounded-panel bg-surface-cta p-4">
                            <PriceBlock
                                price={currentPrice}
                                was={currentWasPrice}
                                size="lg"
                            />
                        </div>
                        {p.frozen && <ColdChainNote />}
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">
                            <span
                                className={
                                    inStock
                                        ? 'font-bold text-success-text'
                                        : 'text-muted-foreground'
                                }
                            >
                                {inStock
                                    ? currentStock <= 5
                                        ? `Only ${currentStock} left`
                                        : 'In stock'
                                    : 'Out of stock'}
                            </span>
                            <span
                                aria-hidden="true"
                                className="text-muted-foreground"
                            >
                                ·
                            </span>
                            <span className="text-muted-foreground">
                                {p.free_shipping
                                    ? 'Free shipping'
                                    : 'Shipping calculated at checkout'}{' '}
                                · ships from {p.ships_from}
                            </span>
                        </p>
                        {p.variations.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setPickerOpen(true)}
                                className="flex min-h-touch-primary w-full items-center justify-between gap-2 rounded-button border border-border-control bg-surface px-3 text-left text-body"
                            >
                                <span>
                                    <span className="text-muted-foreground">
                                        Variation:
                                    </span>{' '}
                                    {variationLabel}
                                </span>
                                <ChevronRight
                                    aria-hidden="true"
                                    className="text-muted-foreground"
                                />
                            </button>
                        )}
                        {inStock && (
                            <div className="flex items-center gap-3">
                                <span className="text-label text-foreground">
                                    Quantity
                                </span>
                                <QuantityStepper
                                    value={qty}
                                    min={1}
                                    max={Math.max(currentStock, 1)}
                                    onChange={setQty}
                                />
                            </div>
                        )}
                        <StickyActionBar>
                            <Link
                                href={shopShow.url(p.shop.slug)}
                                className="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden"
                            >
                                <Store aria-hidden="true" />
                                <span>Shop</span>
                            </Link>
                            {!isAdmin && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleChatClick}
                                        className="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden"
                                    >
                                        <MessageCircle aria-hidden="true" />
                                        <span>Chat</span>
                                    </button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        icon={
                                            <MessageCircle aria-hidden="true" />
                                        }
                                        className="hidden lg:flex"
                                        onClick={handleChatClick}
                                    >
                                        Chat
                                    </Button>
                                </>
                            )}
                            {isOwnProduct ? (
                                <p className="flex-1 self-center text-center text-label text-muted-foreground">
                                    This is your product
                                </p>
                            ) : (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        icon={<DsIcon name="shopping-cart" />}
                                        className="min-w-0 flex-1 px-2.5 min-[400px]:px-4 lg:flex-none lg:px-8 max-[399px]:[&>svg]:hidden"
                                        onClick={() => buyAction(false)}
                                        disabled={!inStock}
                                    >
                                        Add to cart
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="min-w-0 flex-1 px-2.5 min-[400px]:px-4 lg:flex-none lg:px-10"
                                        onClick={() => buyAction(true)}
                                        disabled={!inStock}
                                    >
                                        {inStock ? 'Buy now' : 'Out of stock'}
                                    </Button>
                                </>
                            )}
                        </StickyActionBar>
                        <button
                            type="button"
                            onClick={handleReportClick}
                            className="inline-flex min-h-touch items-center gap-1 self-start text-body-sm text-muted-foreground hover:text-foreground md:hidden"
                        >
                            <Flag aria-hidden="true" className="size-4" />
                            Report this product
                        </button>
                    </div>
                </div>
                <div className="mt-2 md:mt-6">
                    <ShopHeader
                        shop={p.shop}
                        profileHref={shopShow(p.shop.slug).url}
                    />
                </div>
                <section aria-labelledby="pd-halal" className="mt-6 md:mt-8">
                    <h2 id="pd-halal" className="text-h3">
                        Halal status
                    </h2>
                    {p.halal_status === 'na' ? (
                        <p className="card mt-3 p-4 text-body text-muted-foreground">
                            Muslim-friendly · no certificate needed
                        </p>
                    ) : !cert ? (
                        <div className="card mt-3 p-4">
                            <HalalBadge status={p.halal_status} />
                            {halalGuidance[p.halal_status] && (
                                <p className="mt-2 text-body-sm text-muted-foreground">
                                    {halalGuidance[p.halal_status]}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="mt-3">
                                <HalalBadge status={p.halal_status} />
                            </div>
                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                <HalalCertificateCard
                                    id="pd-hc"
                                    certification={cert}
                                />
                                <section
                                    className="panel p-4"
                                    aria-labelledby="pd-decl-h"
                                >
                                    <h3 id="pd-decl-h" className="text-h4">
                                        Seller declaration
                                    </h3>
                                    <p className="mt-1 text-body-sm text-muted-foreground">
                                        Made by {p.shop.name} when listing this
                                        product.
                                    </p>
                                    <ul className="mt-3 grid gap-2 text-body">
                                        {[
                                            'No pork, alcohol or their derivatives in the ingredients.',
                                            'Packed and stored away from non-halal products.',
                                            'Certificate covers the product and the packing facility.',
                                        ].map((t) => (
                                            <li key={t} className="flex gap-2">
                                                <DsIcon
                                                    name="circle-check"
                                                    className="mt-0.5 size-5 shrink-0 text-halal"
                                                />
                                                <span>{t}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-3 text-body-sm text-muted-foreground">
                                        Something wrong with this claim?{' '}
                                        <button
                                            type="button"
                                            onClick={handleReportClick}
                                            className="font-bold text-primary-text underline underline-offset-2"
                                        >
                                            Report a concern
                                        </button>
                                        . We review halal reports first.
                                    </p>
                                </section>
                            </div>
                        </>
                    )}
                </section>
                <section aria-labelledby="pd-det" className="mt-6 md:mt-8">
                    <h2 id="pd-det" className="text-h3">
                        Product details
                    </h2>
                    <Accordion
                        name="pd-details"
                        className="mt-3 overflow-hidden"
                        items={[
                            ...(p.description
                                ? [
                                      {
                                          title: 'Description',
                                          open: true,
                                          content: (
                                              <p className="whitespace-pre-line text-foreground">
                                                  {p.description}
                                              </p>
                                          ),
                                      },
                                  ]
                                : []),
                            {
                                title: 'Specifications',
                                content: (
                                    <KeyValueList
                                        cols={2}
                                        rows={[
                                            ['Category', p.category.name],
                                            [
                                                'Stock',
                                                p.in_stock
                                                    ? `${p.stock} units`
                                                    : 'Out of stock',
                                            ],
                                            ['Ships from', p.ships_from],
                                            ['Sold by', p.shop.name],
                                        ]}
                                    />
                                ),
                            },
                        ]}
                    />
                </section>
                <section
                    id="pd-rev"
                    aria-labelledby="pd-rev-h"
                    className="mt-6 md:mt-8"
                >
                    <h2 id="pd-rev-h" className="text-h3">
                        Ratings & reviews
                    </h2>
                    <div className="card mt-3 p-4">
                        {p.review_count > 0 && (
                            <div className="flex items-center gap-4 border-b border-border pb-4">
                                <p className="text-h2">
                                    <span className="text-foreground">
                                        {p.rating.toFixed(1)}
                                    </span>
                                    <span className="text-body text-muted-foreground">
                                        {' '}
                                        / 5
                                    </span>
                                </p>
                                <div className="flex-1">
                                    <Rating value={p.rating} />
                                </div>
                            </div>
                        )}
                        {reviews.length === 0 ? (
                            <p className="py-6 text-center text-body-sm text-muted-foreground">
                                No reviews yet. Reviews appear after verified
                                purchases.
                            </p>
                        ) : (
                            reviews.map((review, i) => (
                                <ReviewCard key={i} review={review} />
                            ))
                        )}
                    </div>
                </section>
                {related.length > 0 && (
                    <section aria-labelledby="pd-also" className="mt-6 md:mt-8">
                        <h2 id="pd-also" className="text-h3">
                            You may also like
                        </h2>
                        <ul className="bleed-x mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto pb-2">
                            {related.map((r, i) => (
                                <li key={r.id}>
                                    <ProductCard
                                        product={r}
                                        variant="compact"
                                        index={i + 1}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
            <VariationPicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                product={p}
                onConfirm={(selection) => {
                    const variation =
                        p.variations.find(
                            (v) =>
                                v.option1_value === selection.option1 &&
                                (v.option2_value ?? null) ===
                                    (selection.option2 ?? null),
                        ) ?? null;
                    setSelectedVariation(variation);
                    setPickerOpen(false);
                    addToCart(
                        variation?.id ?? null,
                        selection.quantity,
                        selection.buyNow,
                    );
                }}
            />
            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetType="product"
                targetId={p.id}
                targetTitle={`Report ${p.name}`}
            />
        </>
    );
}
