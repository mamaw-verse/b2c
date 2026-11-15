import { Head, InfiniteScroll, router } from '@inertiajs/react';
import { Chip } from '@/components/chip';
import { SearchInput } from '@/components/search-input';
import { ShopCard } from '@/components/shop-card';
import { SortControl } from '@/components/sort-control';
import { EmptyState } from '@/components/ui/empty-state';
import { index as sellersIndex } from '@/routes/shops';
import type { CursorPage, ShopData } from '@/types/catalogue';

const sortOptions = [
    { value: 'followers', label: 'Most followed' },
    { value: 'rating', label: 'Top rated' },
    { value: 'newest', label: 'Newest' },
];

export default function Sellers({
    query,
    filters,
    shops,
}: {
    query: string;
    filters: { halal_only: boolean; sort: string };
    shops: CursorPage<ShopData>;
}) {
    const visit = (patch: {
        q?: string;
        halal_only?: boolean;
        sort?: string;
    }) => {
        const next = {
            q: patch.q ?? query,
            halal_only: patch.halal_only ?? filters.halal_only,
            sort: patch.sort ?? filters.sort,
        };

        router.get(
            sellersIndex({
                query: {
                    q: next.q || undefined,
                    halal_only: next.halal_only ? 1 : undefined,
                    sort: next.sort,
                },
            }).url,
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Sellers" />
            <div className="pt-4 md:pt-6">
                <h1 className="text-h1">Discover sellers</h1>
                <p className="mt-1 text-body text-muted-foreground">
                    Browse verified shops from across the Philippines.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <SearchInput
                        value={query}
                        onSearch={(value) => visit({ q: value })}
                        placeholder="Search sellers"
                        label="Search sellers"
                        className="min-w-0 flex-1"
                    />
                    <SortControl
                        value={filters.sort}
                        options={sortOptions}
                        onChange={(sort) => visit({ sort })}
                        className="w-auto shrink-0"
                    />
                </div>
                <div className="mt-3">
                    <Chip
                        pressed={filters.halal_only}
                        onClick={() =>
                            visit({ halal_only: !filters.halal_only })
                        }
                    >
                        Halal-only shops
                    </Chip>
                </div>
                {shops.data.length === 0 ? (
                    <EmptyState
                        title="No sellers found"
                        text="Try another name or clear the halal-only filter."
                        action={
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() =>
                                    visit({
                                        q: '',
                                        halal_only: false,
                                        sort: 'followers',
                                    })
                                }
                            >
                                Clear filters
                            </button>
                        }
                    />
                ) : (
                    <InfiniteScroll data="shops" itemsElement="#seller-grid">
                        <div
                            id="seller-grid"
                            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {shops.data.map((shop) => (
                                <ShopCard key={shop.id} shop={shop} />
                            ))}
                        </div>
                    </InfiniteScroll>
                )}
            </div>
        </>
    );
}
