import { Head, router, setLayoutProps, usePage } from '@inertiajs/react';
import {
    Check,
    ChevronRight,
    ExternalLink,
    Flag,
    MessageCircle,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BlogCard } from '@/components/blog/blog-card';
import { Breadcrumb } from '@/components/breadcrumb';
import { Carousel } from '@/components/carousel';
import { ColdChainNote } from '@/components/cold-chain-note';
import { DsIcon } from '@/components/ds-icon';
import { FlagProductDialog } from '@/components/flag-product-dialog';
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
import { ShareButtons } from '@/components/share-buttons';
import { ShopHeader } from '@/components/shop-header';
import { SoldCount } from '@/components/sold-count';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { VariationPicker } from '@/components/variation-picker';
import { cn } from '@/lib/utils';
import { home, login } from '@/routes';
import { show as categoryShow } from '@/routes/categories';
import { show as shopShow } from '@/routes/shops';
import type { BlogCardData } from '@/types/blog';
import type {
    ProductCardData,
    ProductDetail,
    ProductShareData,
    ProductVariation,
} from '@/types/catalogue';

export default function Product({
    product: p,
    reviews = [],
    related = [],
    featured_in: featuredIn = [],
    share,
}: {
    product: ProductDetail;
    reviews?: ReviewData[];
    related?: ProductCardData[];
    /** Live blog posts that embed this product (empty while the blog is off). */
    featured_in?: BlogCardData[];
    share?: ProductShareData;
}) {
    const { auth, seller, workspaces } = usePage().props;
    // The sticky action bar replaces the bottom tab bar on this page.
    setLayoutProps({ tabBar: false });
    const isOwnProduct = seller?.shop_id === p.shop.id;
    // Chat is a buyer surface — stripped for admins.
    const isAdmin = (workspaces ?? []).some((w) => w.key === 'admin');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [adminFlagOpen, setAdminFlagOpen] = useState(false);
    const [qty, setQty] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [isVariationConfirmed, setIsVariationConfirmed] = useState(false);

    const actionRowRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(false);

    useEffect(() => {
        const el = actionRowRef.current;
        if (!el) {
            return;
        }

        let inPageView = true;
        let footerInView = false;

        const updateVisibility = () => {
            setShowStickyBar(!inPageView && !footerInView);
        };

        const actionObserver = new IntersectionObserver(
            ([entry]) => {
                inPageView = entry.isIntersecting;
                updateVisibility();
            },
            { threshold: 0.1 },
        );
        actionObserver.observe(el);

        const footerEl = document.querySelector('footer');
        let footerObserver: IntersectionObserver | null = null;
        if (footerEl) {
            footerObserver = new IntersectionObserver(
                ([entry]) => {
                    footerInView = entry.isIntersecting;
                    updateVisibility();
                },
                { threshold: 0.05 },
            );
            footerObserver.observe(footerEl);
        }

        return () => {
            actionObserver.disconnect();
            footerObserver?.disconnect();
        };
    }, []);

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
        quantity: number,
        buyNow: boolean,
    ) => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        if (buyNow) {
            setIsBuying(true);
        } else {
            setIsAdding(true);
        }
        router.post(
            '/cart',
            {
                product_id: p.id,
                product_variation_id: variationId,
                qty: quantity,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (buyNow) {
                        router.visit('/checkout');
                    } else {
                        setIsAdded(true);
                        toast.success('Added to cart.');
                        setTimeout(() => setIsAdded(false), 2000);
                    }
                },
                onError: (errors) => {
                    toast.error(
                        errors.qty ??
                            errors.product ??
                            'This item could not be added to your cart.',
                    );
                },
                onFinish: () => {
                    setIsAdding(false);
                    setIsBuying(false);
                },
            },
        );
    };

    const hasVariations = p.variations.length > 0;
    const buyAction = (buyNow: boolean) => {
        if (hasVariations && !isVariationConfirmed) {
            setPickerOpen(true);
        } else {
            addToCart(selectedVariation?.id ?? null, qty, buyNow);
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

    const halalStatusTitle: Record<string, string> = {
        certified: 'Halal certified',
        na: 'Muslim-friendly · no certificate needed',
        review: 'Certificate under review',
        expiring: 'Certificate expires soon',
        expired: 'Certificate expired',
        missing: 'No certificate on file',
    };

    return (
        <>
            <Head title={p.name} />
            <div className="pb-16 md:pb-0">
                <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:pt-6">
                    {/* Gallery column */}
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
                                    label: `${p.name} – image ${i + 1}`,
                                    icon: img.icon,
                                    src: img.url,
                                    type: 'image' as const,
                                })),
                            ]}
                        />
                    </div>

                    {/* Buy box column */}
                    <div className="grid content-start gap-4 pt-4 md:gap-5 md:pt-0">
                        {/* 1. Breadcrumb + "Report this product" */}
                        <div className="flex items-center justify-between gap-2">
                            <Breadcrumb
                                items={[
                                    { label: 'Home', href: home().url },
                                    {
                                        label: p.category.name,
                                        href: categoryShow.url(p.category.slug),
                                    },
                                ]}
                            />
                            <button
                                type="button"
                                onClick={handleReportClick}
                                className="inline-flex shrink-0 items-center gap-1 text-body-sm text-muted-foreground hover:text-foreground"
                            >
                                <Flag aria-hidden="true" className="size-4" />
                                Report this product
                            </button>
                        </div>

                        {/* 2. Title */}
                        <h1 className="text-h1">{p.name}</h1>

                        {/* 3. Meta line */}
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm">
                            {p.review_count > 0 ? (
                                <>
                                    <Rating value={p.rating} size="size-4" />
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
                                <>
                                    <span className="text-muted-foreground">
                                        No ratings yet
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="text-muted-foreground"
                                    >
                                        ·
                                    </span>
                                </>
                            )}
                            {p.sold_count > 0 && (
                                <>
                                    <span className="text-muted-foreground">
                                        <SoldCount count={p.sold_count} />
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="text-muted-foreground"
                                    >
                                        ·
                                    </span>
                                </>
                            )}
                            <HalalBadge
                                status={p.halal_status}
                                short
                                className="badge-halal"
                            />
                        </p>

                        {/* 4. Price box */}
                        <div className="rounded-panel bg-surface-cta p-4">
                            <PriceBlock
                                price={currentPrice}
                                was={currentWasPrice}
                                size="lg"
                            />
                        </div>
                        {p.frozen && <ColdChainNote />}

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

                        {/* 5. Stock + shipping line */}
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm">
                            <span
                                className={
                                    inStock
                                        ? 'font-bold text-success-text'
                                        : 'font-bold text-muted-foreground'
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

                        {/* 6. ACTION ROW */}
                        <div ref={actionRowRef} className="flex flex-col gap-3">
                            {isOwnProduct ? (
                                <p className="rounded-panel border border-border bg-surface-muted p-3 text-center text-label text-muted-foreground">
                                    This is your product
                                </p>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Quantity label + stepper */}
                                    <div className="flex items-center gap-2">
                                        <span className="hidden text-label text-foreground md:inline">
                                            Qty
                                        </span>
                                        <QuantityStepper
                                            value={qty}
                                            min={1}
                                            max={Math.max(currentStock, 1)}
                                            label="quantity"
                                            disabled={!inStock}
                                            onChange={setQty}
                                            className="h-11 w-[132px]"
                                        />
                                    </div>

                                    {/* Add to cart and Buy now buttons */}
                                    <div className="flex min-w-[280px] flex-1 basis-[280px] items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            icon={
                                                isAdded ? (
                                                    <Check
                                                        aria-hidden="true"
                                                        className="size-4 text-success-text"
                                                    />
                                                ) : isAdding ? (
                                                    <Spinner className="size-4" />
                                                ) : (
                                                    <DsIcon
                                                        name="shopping-cart"
                                                        className="size-4"
                                                    />
                                                )
                                            }
                                            className="h-11 min-w-[140px] flex-1 border-primary/30 text-primary hover:bg-primary-soft"
                                            onClick={() => buyAction(false)}
                                            disabled={
                                                !inStock || isAdding || isBuying
                                            }
                                        >
                                            {isAdded ? 'Added' : 'Add to cart'}
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="h-11 min-w-[140px] flex-1"
                                            onClick={() => buyAction(true)}
                                            disabled={
                                                !inStock || isAdding || isBuying
                                            }
                                            icon={
                                                isBuying ? (
                                                    <Spinner className="size-4" />
                                                ) : undefined
                                            }
                                        >
                                            {inStock
                                                ? isBuying
                                                    ? 'Processing...'
                                                    : 'Buy now'
                                                : 'Out of stock'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 7. SECONDARY ROW: Chat + Share */}
                        <div className="flex flex-wrap items-center gap-3 text-body-sm leading-none">
                            {!isAdmin ? (
                                <button
                                    type="button"
                                    onClick={handleChatClick}
                                    className="inline-flex items-center gap-1.5 font-medium text-primary-text transition-colors hover:text-primary-hover hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                >
                                    <MessageCircle
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                    <span>Chat</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAdminFlagOpen(true)}
                                    className="inline-flex items-center gap-1.5 font-medium text-mod-flagged transition-colors hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-mod-flagged focus-visible:outline-none"
                                >
                                    <Flag
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                    <span>Flag for review</span>
                                </button>
                            )}
                            <div
                                className="h-3.5 w-px bg-border"
                                aria-hidden="true"
                            />
                            {share && (
                                <ShareButtons
                                    url={share.url}
                                    title={p.name}
                                    price={currentPrice}
                                    text={p.description ?? p.name}
                                    count={share.count}
                                    enabled={share.enabled}
                                    slug={p.slug}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 1. Seller card (unchanged) */}
                <div className="mt-6 md:mt-8">
                    <ShopHeader
                        shop={p.shop}
                        profileHref={shopShow(p.shop.slug).url}
                        asHeading="h2"
                    />
                </div>

                {/* 2. Halal status card */}
                <section aria-labelledby="pd-halal" className="mt-6 md:mt-8">
                    <h2 id="pd-halal" className="text-h3">
                        Halal status
                    </h2>
                    <div className="card mt-3 p-4 md:p-6">
                        <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal">
                                <ShieldCheck
                                    className="size-6 text-halal"
                                    aria-hidden="true"
                                />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-h4 text-foreground">
                                        {halalStatusTitle[p.halal_status] ??
                                            'Halal status'}
                                    </span>
                                    <HalalBadge status={p.halal_status} short />
                                </div>
                                {cert && (
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm">
                                        <span>
                                            <span className="text-muted-foreground">
                                                Certificate no:{' '}
                                            </span>
                                            <span className="tabular font-medium text-foreground">
                                                {cert.number}
                                            </span>
                                        </span>
                                        {certValid && (
                                            <span>
                                                <span className="text-muted-foreground">
                                                    Valid until:{' '}
                                                </span>
                                                <span className="tabular font-medium text-foreground">
                                                    {certValid}
                                                </span>
                                            </span>
                                        )}
                                        {cert.document_path && (
                                            <a
                                                href={cert.document_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-semibold text-primary-text underline underline-offset-2 hover:text-primary"
                                            >
                                                View certificate
                                                <ExternalLink
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                            </a>
                                        )}
                                    </div>
                                )}
                                {halalGuidance[p.halal_status] && (
                                    <p className="mt-2 text-body-sm text-muted-foreground">
                                        {halalGuidance[p.halal_status]}
                                    </p>
                                )}
                            </div>
                        </div>

                        {p.halal_status === 'certified' && (
                            <div className="mt-4 border-t border-border pt-4">
                                <HalalFacts
                                    valid={certValid}
                                    frozen={p.frozen}
                                />
                            </div>
                        )}

                        {cert && (
                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
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
                        )}
                    </div>
                </section>

                {/* 3. "Product details" accordion */}
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
                                open: false,
                                content: (
                                    <KeyValueList
                                        cols={2}
                                        rows={[
                                            ['Category', p.category.name],
                                            ...(p.brand
                                                ? ([['Brand', p.brand]] as [
                                                      string,
                                                      React.ReactNode,
                                                  ][])
                                                : []),
                                            [
                                                'Stock',
                                                inStock
                                                    ? `${currentStock} units`
                                                    : 'Out of stock',
                                            ],
                                            ['Ships from', p.ships_from],
                                            ['Sold by', p.shop.name],
                                            ...(p.country_of_origin
                                                ? ([
                                                      [
                                                          'Origin',
                                                          p.country_of_origin,
                                                      ],
                                                  ] as [
                                                      string,
                                                      React.ReactNode,
                                                  ][])
                                                : []),
                                            ...(p.storage_condition
                                                ? ([
                                                      [
                                                          'Storage',
                                                          p.storage_condition,
                                                      ],
                                                  ] as [
                                                      string,
                                                      React.ReactNode,
                                                  ][])
                                                : p.frozen
                                                  ? ([
                                                        [
                                                            'Handling',
                                                            'Frozen (-18°C)',
                                                        ],
                                                    ] as [
                                                        string,
                                                        React.ReactNode,
                                                    ][])
                                                  : []),
                                            ...(p.gtin
                                                ? ([
                                                      [
                                                          'GTIN / Barcode',
                                                          p.gtin,
                                                      ],
                                                  ] as [
                                                      string,
                                                      React.ReactNode,
                                                  ][])
                                                : []),
                                            ...(p.allergens
                                                ? ([
                                                      [
                                                          'Allergens',
                                                          p.allergens,
                                                      ],
                                                  ] as [
                                                      string,
                                                      React.ReactNode,
                                                  ][])
                                                : []),
                                            ...(p.certification
                                                ? [
                                                      [
                                                          'Certificate no.',
                                                          p.certification
                                                              .number,
                                                      ] as [
                                                          string,
                                                          React.ReactNode,
                                                      ],
                                                  ]
                                                : []),
                                        ]}
                                    />
                                ),
                            },
                            {
                                title: 'Shipping & returns',
                                open: false,
                                content: (
                                    <KeyValueList
                                        cols={1}
                                        rows={[
                                            [
                                                'Shipping',
                                                p.free_shipping
                                                    ? 'Free shipping'
                                                    : 'Shipping calculated at checkout based on delivery location',
                                            ],
                                            ['Ships from', p.ships_from],
                                            ...(p.frozen
                                                ? [
                                                      [
                                                          'Handling',
                                                          'Cold-chain delivery (packed with thermal insulation and gel/dry ice to maintain frozen temperature)',
                                                      ] as [
                                                          string,
                                                          React.ReactNode,
                                                      ],
                                                  ]
                                                : []),
                                            [
                                                'Returns',
                                                p.frozen
                                                    ? 'Perishable and frozen items are non-returnable once delivered, unless damaged or spoiled upon arrival.'
                                                    : 'Eligible for return or replacement within 7 days of delivery in original, unopened condition.',
                                            ],
                                        ]}
                                    />
                                ),
                            },
                        ]}
                    />
                </section>

                {/* 4. "Ratings & reviews" */}
                <section
                    id="pd-rev"
                    aria-labelledby="pd-rev-h"
                    className="mt-6 md:mt-8"
                >
                    <h2 id="pd-rev-h" className="text-h3">
                        Ratings & reviews
                    </h2>
                    <div className="card mt-3 p-4 md:p-6">
                        {p.review_count > 0 && (
                            <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
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
                                    <p className="mt-1 text-body-sm text-muted-foreground">
                                        Based on {p.review_count}{' '}
                                        {p.review_count === 1
                                            ? 'rating'
                                            : 'ratings'}
                                    </p>
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

                {/* 5. Blog posts that feature this product */}
                {featuredIn.length > 0 && (
                    <section aria-labelledby="pd-blog" className="mt-6 md:mt-8">
                        <h2 id="pd-blog" className="text-h3">
                            Featured in our blog
                        </h2>
                        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredIn.map((card) => (
                                <li key={card.id}>
                                    <BlogCard card={card} compact />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* 6. "You may also like" (unchanged) */}
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

            {/* Sticky bottom action bar for small screens (< 768px) */}
            <div
                className={cn(
                    'fixed inset-x-0 bottom-[calc(var(--tabbar-h,0px)+env(safe-area-inset-bottom,0px))] z-sticky-bar border-t border-border bg-surface/95 shadow-sticky backdrop-blur transition-transform duration-200 md:hidden',
                    showStickyBar
                        ? 'translate-y-0'
                        : 'pointer-events-none translate-y-full',
                )}
                style={{
                    paddingBottom:
                        'max(0.5rem, env(safe-area-inset-bottom, 0px))',
                }}
            >
                <div className="mx-auto flex items-center gap-2 px-4 py-2">
                    {!isAdmin ? (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleChatClick}
                            aria-label="Chat with seller"
                            className="size-11 shrink-0 rounded-button"
                        >
                            <MessageCircle
                                aria-hidden="true"
                                className="size-5"
                            />
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setAdminFlagOpen(true)}
                            aria-label="Flag product for review"
                            className="size-11 shrink-0 rounded-button text-mod-flagged hover:text-mod-flagged"
                        >
                            <Flag aria-hidden="true" className="size-5" />
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="lg"
                        icon={
                            isAdded ? (
                                <Check
                                    aria-hidden="true"
                                    className="size-4 text-success-text"
                                />
                            ) : isAdding ? (
                                <Spinner className="size-4" />
                            ) : (
                                <DsIcon
                                    name="shopping-cart"
                                    className="size-4"
                                />
                            )
                        }
                        className="h-11 min-w-0 flex-1 px-3"
                        onClick={() => buyAction(false)}
                        disabled={!inStock || isAdding || isBuying}
                    >
                        {isAdded ? 'Added' : 'Add to cart'}
                    </Button>
                    <Button
                        size="lg"
                        className="h-11 min-w-0 flex-1 px-3"
                        onClick={() => buyAction(true)}
                        disabled={!inStock || isAdding || isBuying}
                        icon={
                            isBuying ? (
                                <Spinner className="size-4" />
                            ) : undefined
                        }
                    >
                        {inStock
                            ? isBuying
                                ? 'Processing...'
                                : 'Buy now'
                            : 'Out of stock'}
                    </Button>
                </div>
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
                    setIsVariationConfirmed(true);
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
            {isAdmin && (
                <FlagProductDialog
                    open={adminFlagOpen}
                    onClose={() => setAdminFlagOpen(false)}
                    initialProduct={{
                        id: p.id,
                        name: p.name,
                        shop_name: p.shop?.name,
                        thumbnail_url: p.images[0]?.url ?? null,
                    }}
                />
            )}
        </>
    );
}
