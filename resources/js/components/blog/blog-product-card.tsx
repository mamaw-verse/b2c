import { ProductCard } from '@/components/product-card';
import { trackSelectItem } from '@/lib/analytics';
import type { ProductCardData } from '@/types/catalogue';

export type BlogProductList = { id: string; name: string };

/**
 * A shoppable product inside an article. Reuses the storefront card (halal badge, live price,
 * stock) in its list layout. The product link stays clean (no UTM parameters, plan §7.3);
 * clicking it fires a GA4 `select_item` event tagged with the post as the item list.
 */
export function BlogProductCard({
    product,
    list,
    index = 0,
}: {
    product: ProductCardData;
    list?: BlogProductList;
    index?: number;
}) {
    return (
        <div
            className="my-6 max-w-prose"
            data-blog-product-card
            onClick={(event) => {
                // The whole card is one stretched link; only count clicks that land on it.
                if (list && (event.target as HTMLElement).closest('a')) {
                    trackSelectItem(list, product, index);
                }
            }}
        >
            <ProductCard product={product} variant="list" quickAdd={false} />
        </div>
    );
}
