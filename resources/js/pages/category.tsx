import { Head, InfiniteScroll, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Chip } from '@/components/chip';
import { ProductGrid, ProductGridSkeleton } from '@/components/product-card';
import { SortControl, type SortKey } from '@/components/sort-control';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { home } from '@/routes';
import { show as categoryShow } from '@/routes/categories';
import type {
    CategoryData,
    CursorPage,
    ProductCardData,
} from '@/types/catalogue';

const SCROLL_MASK =
    'max-lg:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]';

type Filters = { sort: SortKey; halal: boolean };

export default function Category({
    category,
    filters,
    total,
    products,
}: {
    category: CategoryData;
    filters: Filters;
    total: number;
    products: CursorPage<ProductCardData>;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const visit = (patch: Partial<Filters>) => {
        setLoading(true);
        setError(false);
        router.get(
            categoryShow(category.slug, {
                query: {
                    sort: filters.sort,
                    ...(filters.halal || patch.halal ? { halal: 1 } : {}),
                    ...patch,
                },
            }).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
                onError: () => {
                    setLoading(false);
                    setError(true);
                },
            },
        );
    };

    const crumbs = [
        { label: 'Home', href: home().url },
        ...(category.parent
            ? [
                  {
                      label: category.parent.name,
                      href: categoryShow.url(category.parent.slug),
                  },
              ]
            : []),
        { label: category.name },
    ];

    const count = filters.halal
        ? `${total} halal-certified product${total === 1 ? '' : 's'}`
        : `${total} product${total === 1 ? '' : 's'}`;

    const chips = (
        <>
            {category.children && category.children.length > 0 && (
                <div
                    role="group"
                    aria-label="Subcategories"
                    className={`bleed-x mt-4 flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 ${SCROLL_MASK}`}
                >
                    {category.children.map((child, i) => (
                        <Link
                            key={child.id}
                            href={categoryShow.url(child.slug)}
                            data-edge={i === 0 ? 'start' : undefined}
                            className="relative inline-flex min-h-9 shrink-0 items-center rounded-full border border-border-control bg-surface px-3 text-label font-medium whitespace-nowrap text-foreground transition-colors duration-token after:absolute after:-inset-x-px after:-inset-y-[5px] hover:bg-surface-muted"
                        >
                            {child.name}
                        </Link>
                    ))}
                </div>
            )}
            <div className="mt-2 flex items-center gap-2">
                <div
                    role="group"
                    aria-label="Filters"
                    className={`bleed-x flex min-w-0 flex-1 [scrollbar-width:none] gap-2 overflow-x-auto pb-1 ${SCROLL_MASK}`}
                >
                    <Chip
                        pressed={filters.halal}
                        onClick={() => visit({ halal: !filters.halal })}
                    >
                        Halal certified
                    </Chip>
                </div>
                <SortControl
                    value={filters.sort}
                    onChange={(sort) => visit({ sort: sort as SortKey })}
                    className="w-auto shrink-0"
                />
            </div>
        </>
    );

    return (
        <>
            <Head title={category.name} />
            <div>
                <div className="pt-4 md:pt-6">
                    <Breadcrumb items={crumbs} />
                    <h1 className="mt-2 text-h1" data-edge="start">
                        {category.name}
                    </h1>
                    <p className="mt-1 text-body text-muted-foreground">
                        <span className="tabular">{count}</span>
                    </p>
                </div>
                {chips}
                <h2 className="sr-only">Products</h2>
                {error ? (
                    <ErrorState
                        title="Couldn't load products"
                        onRetry={() => visit({})}
                    />
                ) : loading ? (
                    <ProductGridSkeleton />
                ) : products.data.length === 0 ? (
                    <EmptyState
                        title="No products match"
                        text="Try removing a filter."
                        action={
                            <Link
                                href={categoryShow.url(category.slug)}
                                className="btn btn-outline"
                            >
                                Clear filters
                            </Link>
                        }
                    />
                ) : (
                    <>
                        <InfiniteScroll
                            data="products"
                            itemsElement="#cat-grid"
                        >
                            <ProductGrid
                                id="cat-grid"
                                products={products.data}
                                className="pt-3"
                            />
                        </InfiniteScroll>
                        {products.next_cursor === null && (
                            <p className="py-4 text-center text-body-sm text-muted-foreground">
                                You've seen all {total}{' '}
                                {total === 1 ? 'product' : 'products'}
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
