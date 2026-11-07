import { Head, InfiniteScroll } from '@inertiajs/react';
import { Banknote, ShieldCheck, Snowflake } from 'lucide-react';
import { CategoryGrid } from '@/components/category-tile';
import { ProductGrid } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { VoucherCard } from '@/components/voucher-card';
import type {
    CategoryData,
    CursorPage,
    ProductCardData,
} from '@/types/catalogue';

const trust = [
    [
        ShieldCheck,
        'Certificates checked',
        'Every halal claim is verified by us',
    ],
    [Snowflake, 'Cold-chain delivery', 'Frozen items ship with ice packs'],
    [Banknote, 'Cash on delivery', 'Pay the rider on arrival'],
] as const;

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
}: {
    categories: CategoryData[];
    products: CursorPage<ProductCardData>;
    vouchers: HomeVoucher[];
}) {
    return (
        <>
            <Head title="Home" />
            <div className="mx-auto max-w-container">
                <div className="px-gutter pt-4">
                    <div className="relative overflow-hidden rounded-hero bg-surface-hero p-5 md:p-8">
                        <img
                            src="/images/banners/hero-halal-fiesta-banner.png"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 size-full object-cover object-right"
                        />
                        <div className="pattern-geo pointer-events-none absolute inset-0 opacity-20" />
                        <div className="relative z-10 grid max-w-lg gap-2 rounded-panel bg-surface/85 p-4 backdrop-blur-xs md:p-6">
                            <p className="text-eyebrow font-bold tracking-wider text-primary uppercase">
                                Halal Pantry Fair
                            </p>
                            <h1 className="max-w-md text-h1 drop-shadow-xs">
                                Certified halal pantry staples, up to ₱300 off
                            </h1>
                            <p>
                                <Button size="lg">Shop the fair</Button>
                            </p>
                        </div>
                    </div>
                </div>
                <ul
                    aria-label="Why shop halal here"
                    className="mx-auto mt-3 grid max-w-container grid-cols-1 gap-2 px-gutter sm:grid-cols-3"
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
                <section aria-labelledby="home-cats" className="mt-6 md:mt-8">
                    <h2 id="home-cats" className="px-gutter text-h3 md:px-0">
                        Categories
                    </h2>
                    <div className="mt-3 px-gutter">
                        <CategoryGrid categories={categories} />
                    </div>
                </section>
                {vouchers.length > 0 && (
                    <section
                        aria-labelledby="home-vouch"
                        className="mt-6 md:mt-8"
                    >
                        <h2
                            id="home-vouch"
                            className="px-gutter text-h3 md:px-0"
                        >
                            Vouchers for you
                        </h2>
                        <ul className="mt-3 flex [scrollbar-width:none] gap-3 overflow-x-auto px-gutter pb-1 md:grid md:grid-cols-3 md:px-0">
                            {vouchers.map((v) => (
                                <li
                                    key={v.title}
                                    className="w-72 shrink-0 md:w-auto"
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
                <section aria-labelledby="home-grid-h" className="mt-6 md:mt-8">
                    <h2 id="home-grid-h" className="px-gutter text-h3 md:px-0">
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
                                className="px-gutter md:px-0"
                            />
                        </InfiniteScroll>
                    </div>
                </section>
            </div>
        </>
    );
}
