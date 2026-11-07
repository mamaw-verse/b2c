import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, Flag, MessageCircle, Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Carousel } from '@/components/carousel';
import { ColdChainNote } from '@/components/cold-chain-note';
import { DsIcon } from '@/components/ds-icon';
import { HalalCertificateCard } from '@/components/halal-certificate-card';
import { HalalFacts } from '@/components/halal-facts';
import { KeyValueList } from '@/components/key-value-list';
import { PriceBlock } from '@/components/price-block';
import { ProductCard } from '@/components/product-card';
import { Rating } from '@/components/rating';
import { ReportDialog } from '@/components/report-dialog';
import { ReviewCard, type ReviewData } from '@/components/review-card';
import { ShopHeader } from '@/components/shop-header';
import { SoldCount } from '@/components/sold-count';
import { StickyActionBar } from '@/components/sticky-action-bar';
import { Button } from '@/components/ui/button';
import { VariationPicker } from '@/components/variation-picker';
import { login } from '@/routes';
import { show as shopShow } from '@/routes/shops';
import type { ProductCardData, ProductDetail } from '@/types/catalogue';

export default function Product({
    product: p,
    reviews = [],
    related = [],
}: {
    product: ProductDetail;
    reviews?: ReviewData[];
    related?: ProductCardData[];
}) {
    const { name, auth } = usePage().props;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    const handleChatClick = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        router.post('/chat', {
            shop_id: p.shop.id,
            product_id: p.id,
        });
    };
    const firstVariation = p.variations[0];
    const variationLabel = firstVariation
        ? `${firstVariation.option1_value}${firstVariation.option2_value ? ` · ${firstVariation.option2_value}` : ''}`
        : 'Default';
    const cert = p.certification;
    const certBodyShort =
        cert?.certifying_body.match(/\(([^)]+)\)/)?.[1] ??
        cert?.certifying_body;
    const certValid = cert
        ? new Date(cert.valid_until).toLocaleDateString('en-PH', {
              month: 'short',
              year: 'numeric',
          })
        : null;

    const buyAction = () => {
        if (p.option1_name) {
            setPickerOpen(true);
        } else {
            toast.info('Cart and checkout arrive with the next milestone.');
        }
    };

    return (
        <>
            <Head title={p.name} />
            <div className="mx-auto max-w-container">
                <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8 lg:px-gutter lg:pt-6">
                    <div>
                        <Carousel
                            slides={p.images.map((img, i) => ({
                                label: `${p.name} photo ${i + 1}`,
                                icon: img.icon,
                                src: img.url,
                            }))}
                        />
                    </div>
                    <div className="grid content-start gap-4 px-gutter py-4 lg:px-0 lg:py-0">
                        <div>
                            <h1 className="text-h2">{p.name}</h1>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">
                                <Rating value={p.rating} size="size-4" />
                                <a
                                    href="#pd-rev"
                                    className="inline-flex min-h-touch items-center text-muted-foreground underline underline-offset-2"
                                >
                                    ratings
                                </a>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">
                                    <SoldCount count={p.sold_count} />
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setReportOpen(true)}
                                    className="ml-auto inline-flex min-h-touch items-center gap-1 text-muted-foreground hover:text-foreground"
                                >
                                    <Flag
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Report
                                </button>
                            </p>
                        </div>
                        {p.halal_status === 'certified' && (
                            <HalalFacts
                                body={certBodyShort}
                                valid={certValid}
                                frozen={p.frozen}
                            />
                        )}
                        <div className="rounded-panel bg-surface-cta p-3 md:p-4">
                            <PriceBlock
                                price={p.price}
                                was={p.was_price}
                                size="lg"
                            />
                        </div>
                        {p.frozen && <ColdChainNote />}
                        <KeyValueList
                            rows={[
                                ['Shipping', `Free shipping · ${p.location}`],
                                ['Returns', '7-day returns for sealed items'],
                                [
                                    'Authenticity',
                                    p.halal_status === 'certified'
                                        ? `Certificate verified by ${name}`
                                        : 'Muslim-friendly product',
                                ],
                            ]}
                        />
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
                        <StickyActionBar>
                            <Link
                                href={shopShow.url(p.shop.slug)}
                                className="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden"
                            >
                                <Store aria-hidden="true" />
                                <span>Shop</span>
                            </Link>
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
                                icon={<MessageCircle aria-hidden="true" />}
                                className="hidden lg:flex"
                                onClick={handleChatClick}
                            >
                                Chat
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<DsIcon name="shopping-cart" />}
                                className="min-w-0 flex-1 px-2.5 min-[400px]:px-4 lg:flex-none lg:px-8 max-[399px]:[&>svg]:hidden"
                                onClick={buyAction}
                            >
                                Add to cart
                            </Button>
                            <Button
                                size="lg"
                                className="min-w-0 flex-1 px-2.5 min-[400px]:px-4 lg:flex-none lg:px-10"
                                onClick={buyAction}
                            >
                                Buy now
                            </Button>
                        </StickyActionBar>
                    </div>
                </div>
                <div className="mt-2 px-gutter md:mt-6">
                    <ShopHeader shop={p.shop} />
                </div>
                {cert && (
                    <section
                        aria-labelledby="pd-halal"
                        className="mt-6 px-gutter md:mt-8 lg:px-0"
                    >
                        <h2 id="pd-halal" className="text-h3">
                            Halal certification
                        </h2>
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
                                        onClick={() => setReportOpen(true)}
                                        className="font-bold text-primary underline underline-offset-2"
                                    >
                                        Report a concern
                                    </button>
                                    . We review halal reports first.
                                </p>
                            </section>
                        </div>
                    </section>
                )}
                <section
                    aria-labelledby="pd-det"
                    className="mt-6 px-gutter md:mt-8 lg:px-0"
                >
                    <h2 id="pd-det" className="text-h3">
                        Product details
                    </h2>
                    <div className="card mt-3 p-4">
                        <KeyValueList
                            cols={2}
                            rows={[
                                ['Category', p.category.name],
                                ['Stock', `${p.stock} units`],
                                ['Ships from', p.location],
                                ['Sold by', p.shop.name],
                            ]}
                        />
                        {p.description && (
                            <p className="mt-4 text-body">{p.description}</p>
                        )}
                    </div>
                </section>
                <section
                    id="pd-rev"
                    aria-labelledby="pd-rev-h"
                    className="mt-6 px-gutter md:mt-8 lg:px-0"
                >
                    <h2 id="pd-rev-h" className="text-h3">
                        Ratings & reviews
                    </h2>
                    <div className="card mt-3 p-4">
                        <div className="flex items-center gap-4 border-b border-border pb-4">
                            <p className="text-h2">
                                <span className="text-sale">
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
                        {reviews.length === 0 ? (
                            <p className="py-6 text-center text-body-sm text-muted-foreground">
                                No reviews yet.
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
                        <h2 id="pd-also" className="px-gutter text-h3 md:px-0">
                            You may also like
                        </h2>
                        <ul className="mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-gutter pb-2 md:px-0">
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
                onConfirm={() => {
                    setPickerOpen(false);
                    toast.info(
                        'Cart and checkout arrive with the next milestone.',
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
