import { Head, InfiniteScroll, router } from '@inertiajs/react';
import { useState } from 'react';
import { Chip } from '@/components/chip';
import { ProductGrid, ProductGridSkeleton } from '@/components/product-card';
import { SortControl } from '@/components/sort-control';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { search } from '@/routes';
import type { CursorPage, ProductCardData } from '@/types/catalogue';

const SCROLL_MASK =
    'max-lg:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]';

type Filters = {
    q?: string;
    halal?: boolean;
    free_shipping?: boolean;
    frozen?: boolean;
    sort?: string;
};

export default function Search({
    query,
    filters,
    products,
}: {
    query: string;
    filters: Filters;
    products: CursorPage<ProductCardData>;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const visit = (patch: Partial<Filters>) => {
        setLoading(true);
        setError(false);
        router.get(
            search({
                query: {
                    ...filters,
                    q: query,
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

    return (
        <>
            <Head title={query ? `“${query}”` : 'Search'} />
            <div>
                <div className="pt-4 md:pt-6">
                    <h1 className="text-h2">
                        {query ? `“${query}”` : 'Browse products'}
                    </h1>
                    <p className="mt-0.5 text-body text-muted-foreground">
                        <span className="tabular">
                            {products.data.length}
                            {products.next_cursor ? '+' : ''}
                        </span>{' '}
                        results
                    </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div
                        role="group"
                        aria-label="Filters"
                        className={`bleed-x flex min-w-0 flex-1 [scrollbar-width:none] gap-2 overflow-x-auto pb-1 ${SCROLL_MASK}`}
                    >
                        <Chip
                            pressed={filters.halal ?? false}
                            onClick={() =>
                                visit({ halal: !(filters.halal ?? false) })
                            }
                        >
                            Halal certified
                        </Chip>
                        <Chip
                            pressed={filters.free_shipping ?? false}
                            onClick={() =>
                                visit({ free_shipping: !filters.free_shipping })
                            }
                        >
                            Free shipping
                        </Chip>
                        <Chip
                            icon="snowflake"
                            pressed={filters.frozen ?? false}
                            onClick={() => visit({ frozen: !filters.frozen })}
                        >
                            Ships frozen
                        </Chip>
                    </div>
                    <SortControl
                        value={filters.sort ?? 'top_sales'}
                        onChange={(sort) => visit({ sort })}
                        className="w-auto shrink-0"
                    />
                </div>
                <h2 className="sr-only">Results</h2>
                {error ? (
                    <ErrorState
                        title="Couldn't load results"
                        onRetry={() => visit({})}
                    />
                ) : loading ? (
                    <ProductGridSkeleton />
                ) : products.data.length === 0 ? (
                    <EmptyState
                        title="No products match"
                        text="Try removing a filter or a different search."
                        action={
                            <a href={search.url()} className="btn btn-outline">
                                Clear filters
                            </a>
                        }
                    />
                ) : (
                    <>
                        <InfiniteScroll data="products" itemsElement="#sr-grid">
                            <ProductGrid
                                id="sr-grid"
                                products={products.data}
                                className="pt-3"
                            />
                        </InfiniteScroll>
                        {products.next_cursor === null && (
                            <p className="py-4 text-center text-body-sm text-muted-foreground">
                                You've seen all {products.data.length}{' '}
                                {products.data.length === 1
                                    ? 'product'
                                    : 'products'}
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
