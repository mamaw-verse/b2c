import { Head, InfiniteScroll, Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    ShieldCheck,
    Snowflake,
    type LucideIcon,
} from 'lucide-react';
import { CategoryGrid } from '@/components/category-tile';
import { HomeBenefits } from '@/components/home-benefits';
import { ProductGrid } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { VoucherCard } from '@/components/voucher-card';
import { register as sellerRegister } from '@/routes/seller';
import type {
    CategoryData,
    CursorPage,
    ProductCardData,
} from '@/types/catalogue';

type HomeVoucher = {
    title: string;
    min: string | null;
    expiry: string;
    kind: 'shop' | 'platform' | 'shipping';
};

export default function Home({
    categories,
    products,
    vouchers,
    canBecomeSeller = false,
    halalCertificationUrl,
    b2bUrl,
}: {
    categories: CategoryData[];
    products: CursorPage<ProductCardData>;
    vouchers: HomeVoucher[];
    canBecomeSeller?: boolean;
    halalCertificationUrl?: string | null;
    b2bUrl?: string | null;
}) {
    const { marketplace: m, auth } = usePage().props;
    const trust: [LucideIcon, string, string][] = [
        ...(m.claims.halal_verification && m.trust.certificates
            ? ([
                  [
                      ShieldCheck,
                      'Certificates checked',
                      'Every halal claim is verified by us',
                  ],
              ] as [LucideIcon, string, string][])
            : []),
        ...(m.trust.cold_chain
            ? ([
                  [
                      Snowflake,
                      'Cold-chain delivery',
                      'Frozen items ship with ice packs',
                  ],
              ] as [LucideIcon, string, string][])
            : []),
        ...(m.trust.cod && m.payments.includes('COD')
            ? ([[Banknote, 'Cash on delivery', 'Pay the rider on arrival']] as [
                  LucideIcon,
                  string,
                  string,
              ][])
            : []),
    ];

    return (
        <>
            <Head title="Home" />
            <div>
                <div className="pt-4">
                    <div className="relative overflow-hidden rounded-hero bg-surface-hero p-5 md:p-8">
                        <img
                            src="/images/banners/hero-halal-fiesta-banner.png"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 size-full object-cover object-right"
                        />
                        <div className="pattern-geo pointer-events-none absolute inset-0 opacity-20" />
                        <div className="relative z-10 grid max-w-lg gap-2 rounded-panel bg-surface/85 p-4 backdrop-blur-xs md:p-6">
                            <p className="text-eyebrow font-bold tracking-wider text-primary-text uppercase">
                                Halal Pantry Fair
                            </p>
                            <h1 className="max-w-md text-h1 drop-shadow-xs">
                                Certified halal pantry staples, up to ₱300 off
                            </h1>
                            <p className="flex flex-wrap gap-2">
                                <Button size="lg">Shop the fair</Button>
                                {auth?.user ? (
                                    canBecomeSeller && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={sellerRegister.url()}>
                                                Start Selling
                                            </Link>
                                        </Button>
                                    )
                                ) : (
                                    <Button size="lg" variant="outline" asChild>
                                        <Link href="/register">
                                            Start Selling
                                        </Link>
                                    </Button>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                {trust.length > 0 && (
                    <ul
                        aria-label="Why shop halal here"
                        className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"
                    >
                        {trust.map(([Icon, title, desc]) => (
                            <li
                                key={title}
                                className="flex items-center gap-3 rounded-panel border border-border bg-surface p-3"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal">
                                    <Icon aria-hidden="true" />
                                </span>
                                <span className="grid">
                                    <span className="text-label">{title}</span>
                                    <span className="text-body-sm text-muted-foreground">
                                        {desc}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <section aria-labelledby="home-cats" className="mt-6 md:mt-8">
                    <h2 id="home-cats" className="text-h3" data-edge="start">
                        Categories
                    </h2>
                    <div className="mt-3">
                        <CategoryGrid categories={categories} />
                    </div>
                </section>
                {vouchers.length > 0 && (
                    <section
                        aria-labelledby="home-vouch"
                        className="mt-6 md:mt-8"
                    >
                        <h2 id="home-vouch" className="text-h3">
                            Vouchers for you
                        </h2>
                        <ul className="bleed-x mt-3 flex [scrollbar-width:none] gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3">
                            {vouchers.map((v) => (
                                <li
                                    key={v.title}
                                    className="w-72 shrink-0 md:h-full md:w-auto"
                                >
                                    <VoucherCard
                                        title={v.title}
                                        min={v.min}
                                        expiry={v.expiry}
                                        kind={v.kind}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <HomeBenefits
                    canBecomeSeller={canBecomeSeller}
                    halalCertificationUrl={halalCertificationUrl}
                    b2bUrl={b2bUrl}
                />

                <section aria-labelledby="home-grid-h" className="mt-6 md:mt-8">
                    <h2 id="home-grid-h" className="text-h3">
                        Daily discover
                    </h2>
                    <div className="mt-3">
                        <InfiniteScroll
                            data="products"
                            itemsElement="#home-grid"
                        >
                            <ProductGrid
                                id="home-grid"
                                products={products.data}
                            />
                        </InfiniteScroll>
                        {products.next_cursor === null &&
                            products.data.length > 0 && (
                                <p className="py-4 text-center text-body-sm text-muted-foreground">
                                    You've seen all {products.data.length}{' '}
                                    {products.data.length === 1
                                        ? 'product'
                                        : 'products'}
                                </p>
                            )}
                    </div>
                </section>
            </div>
        </>
    );
}
