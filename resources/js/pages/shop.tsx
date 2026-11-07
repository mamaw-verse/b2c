import { Head, InfiniteScroll, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Chip } from '@/components/chip';
import { ProductGrid } from '@/components/product-card';
import { ReportDialog } from '@/components/report-dialog';
import { ShopHeader } from '@/components/shop-header';
import { login } from '@/routes';
import { show as shopShow } from '@/routes/shops';
import type { CursorPage, ProductCardData, ShopData } from '@/types/catalogue';

const sorts = [
    { key: 'relevant', label: 'Relevant' },
    { key: 'top_sales', label: 'Top sales' },
    { key: 'newest', label: 'New arrivals' },
    { key: 'sale', label: 'Sale', icon: 'tag' },
    { key: 'price_asc', label: 'Price', icon: 'arrow-down' },
];

export default function Shop({
    shop,
    products,
}: {
    shop: ShopData;
    products: CursorPage<ProductCardData>;
}) {
    const { auth } = usePage().props;
    const [reportOpen, setReportOpen] = useState(false);

    const handleChat = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        router.post('/chat', { shop_id: shop.id });
    };

    const grid = (
        <>
            <div
                role="group"
                aria-label="Sort and filter"
                className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1"
            >
                {sorts.map((s) => (
                    <Chip
                        key={s.key}
                        icon={s.icon}
                        onClick={() =>
                            router.get(
                                shopShow(shop.slug, {
                                    query: { sort: s.key },
                                }).url,
                            )
                        }
                    >
                        {s.label}
                    </Chip>
                ))}
            </div>
            <InfiniteScroll data="products" itemsElement="#shop-grid">
                <ProductGrid
                    id="shop-grid"
                    products={products.data}
                    className="pt-3"
                />
            </InfiniteScroll>
        </>
    );

    return (
        <>
            <Head title={shop.name} />
            <div className="mx-auto max-w-container">
                <div className="px-gutter pt-4 md:pt-6">
                    <ShopHeader
                        shop={shop}
                        onChat={handleChat}
                        onReport={() => setReportOpen(true)}
                    />
                </div>
                <div className="mt-4 bg-surface px-gutter py-4 md:mt-6 md:rounded-panel md:border md:border-border md:px-4">
                    <h2 className="sr-only">Products</h2>
                    {grid}
                </div>
            </div>
            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetType="shop"
                targetId={shop.id}
                targetTitle={`Report ${shop.name}`}
            />
        </>
    );
}
