import { Head, InfiniteScroll, router } from '@inertiajs/react';
import { Chip } from '@/components/chip';
import { ProductGrid } from '@/components/product-card';
import { search } from '@/routes';
import type { CursorPage, ProductCardData } from '@/types/catalogue';

type Filters = {
    q?: string;
    halal?: boolean;
    free_shipping?: boolean;
    frozen?: boolean;
    sort?: string;
};

const sorts: { key: string; label: string; icon?: string }[] = [
    { key: 'relevant', label: 'Relevant' },
    { key: 'newest', label: 'Newest' },
    { key: 'top_sales', label: 'Top sales' },
    { key: 'price_asc', label: 'Price', icon: 'arrow-down' },
];

export default function Search({
    query,
    filters,
    products,
}: {
    query: string;
    filters: Filters;
    products: CursorPage<ProductCardData>;
}) {
    const visit = (patch: Partial<Filters>) => {
        router.get(
            search({
                query: {
                    ...filters,
                    q: query,
                    ...patch,
                },
            }).url,
        );
    };

    return (
        <>
            <Head title={query ? `“${query}”` : 'Search'} />
            <div className="mx-auto max-w-container">
                <div className="px-gutter pt-4 md:pt-6">
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
                <div
                    role="group"
                    aria-label="Sort and filter"
                    className="mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-gutter pb-1 md:px-0"
                >
                    {sorts.map((s) => (
                        <Chip
                            key={s.key}
                            icon={s.icon}
                            pressed={(filters.sort ?? 'relevant') === s.key}
                            onClick={() => visit({ sort: s.key })}
                        >
                            {s.label}
                        </Chip>
                    ))}
                    <Chip
                        pressed={filters.halal ?? true}
                        onClick={() =>
                            visit({ halal: !(filters.halal ?? true) })
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
                <h2 className="sr-only">Results</h2>
                <InfiniteScroll data="products" itemsElement="#sr-grid">
                    <ProductGrid
                        id="sr-grid"
                        products={products.data}
                        className="px-gutter pt-3 md:px-0"
                    />
                </InfiniteScroll>
            </div>
        </>
    );
}
