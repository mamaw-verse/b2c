import { Head, InfiniteScroll, router } from '@inertiajs/react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Chip } from '@/components/chip';
import { ProductGrid } from '@/components/product-card';
import { home } from '@/routes';
import { show as categoryShow } from '@/routes/categories';
import type {
    CategoryData,
    CursorPage,
    ProductCardData,
} from '@/types/catalogue';

const sorts = [
    { key: 'relevant', label: 'Relevant' },
    { key: 'newest', label: 'Newest' },
    { key: 'top_sales', label: 'Top sales' },
    { key: 'price_asc', label: 'Price', icon: 'arrow-down' },
];

export default function Category({
    category,
    products,
}: {
    category: CategoryData;
    products: CursorPage<ProductCardData>;
}) {
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

    return (
        <>
            <Head title={category.name} />
            <div className="mx-auto max-w-container">
                <div className="px-gutter pt-4 md:pt-6">
                    <Breadcrumb items={crumbs} />
                    <h1 className="mt-2 text-h1">{category.name}</h1>
                    <p className="mt-1 text-body text-muted-foreground">
                        <span className="tabular">{products.data.length}+</span>{' '}
                        products · all certificates verified
                    </p>
                </div>
                {category.children && category.children.length > 0 && (
                    <div
                        role="group"
                        aria-label="Subcategories"
                        className="mt-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-gutter pb-1 md:px-0"
                    >
                        {category.children.map((child) => (
                            <Chip
                                key={child.id}
                                onClick={() =>
                                    router.get(categoryShow.url(child.slug))
                                }
                            >
                                {child.name}
                            </Chip>
                        ))}
                    </div>
                )}
                <div
                    role="group"
                    aria-label="Sort and filter"
                    className="mt-2 flex [scrollbar-width:none] gap-2 overflow-x-auto px-gutter pb-1 md:px-0"
                >
                    {sorts.map((s) => (
                        <Chip
                            key={s.key}
                            icon={s.icon}
                            onClick={() =>
                                router.get(
                                    categoryShow(category.slug, {
                                        query: { sort: s.key },
                                    }).url,
                                )
                            }
                        >
                            {s.label}
                        </Chip>
                    ))}
                    <Chip pressed>Halal certified</Chip>
                </div>
                <h2 className="sr-only">Products</h2>
                <InfiniteScroll data="products" itemsElement="#cat-grid">
                    <ProductGrid
                        id="cat-grid"
                        products={products.data}
                        className="px-gutter pt-3 md:px-0"
                    />
                </InfiniteScroll>
            </div>
        </>
    );
}
