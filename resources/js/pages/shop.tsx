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
    const { auth, seller, workspaces } = usePage().props;
    const isAdmin = (workspaces ?? []).some((w) => w.key === 'admin');
    const isOwner = seller?.shop_id === shop.id;
    const canInteract = !isAdmin && !isOwner;
    const [reportOpen, setReportOpen] = useState(false);

    const handleChat = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        router.post('/account/chat', { shop_id: shop.id });
    };

    const handleFollow = () => {
        if (!auth.user) {
            router.visit(login().url);
            return;
        }
        if (shop.is_following) {
            router.delete(`/shops/${shop.slug}/follow`, {
                preserveScroll: true,
                only: ['shop'],
            });
        } else {
            router.post(
                `/shops/${shop.slug}/follow`,
                {},
                {
                    preserveScroll: true,
                    only: ['shop'],
                },
            );
        }
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
            <div>
                <div className="pt-4 md:pt-6">
                    <ShopHeader
                        shop={shop}
                        onFollow={canInteract ? handleFollow : undefined}
                        following={shop.is_following}
                        onChat={canInteract ? handleChat : undefined}
                        onReport={() => setReportOpen(true)}
                    />
                </div>
                <div className="bleed-x mt-4 bg-surface py-4 md:mx-0 md:mt-6 md:rounded-panel md:border md:border-border md:px-4">
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
