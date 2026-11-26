import type { ProductCardData } from '@/types/catalogue';

type GtagFunction = (
    command: 'event',
    name: string,
    params?: Record<string, unknown>,
) => void;

declare global {
    interface Window {
        /** Defined by the inline GA4 snippet in `app.blade.php`; absent when GA is not configured. */
        gtag?: GtagFunction;
    }
}

/**
 * Sends a GA4 event when `gtag` exists. A no-op when it does not (GA not configured, blocked by
 * the visitor's browser, or server-side rendering), so callers never need to check.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
        return;
    }

    try {
        window.gtag('event', name, params);
    } catch {
        // Analytics must never break the page.
    }
}

/**
 * GA4 `select_item` for a product picked from a named list, e.g. a blog post's product embed.
 * Prices are stored in centavos; GA4 expects currency units.
 */
export function trackSelectItem(
    list: { id: string; name: string },
    product: Pick<ProductCardData, 'id' | 'name' | 'price'>,
    index = 0,
) {
    trackEvent('select_item', {
        item_list_id: list.id,
        item_list_name: list.name,
        items: [
            {
                item_id: product.id,
                item_name: product.name,
                price: product.price / 100,
                currency: 'PHP',
                index,
                item_list_id: list.id,
                item_list_name: list.name,
            },
        ],
    });
}
