import { Link } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import { show as productShow } from '@/routes/products';
import type { ChatOrderSummary } from '@/types/chat';

export interface ChatProductCardProps {
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        was_price?: number | null;
        image_url?: string | null;
    };
    out?: boolean;
    className?: string;
}

export function ChatProductCard({
    product,
    out = true,
    className,
}: ChatProductCardProps) {
    const hasDiscount =
        product.was_price != null && product.was_price > product.price;
    const discountPct = hasDiscount
        ? Math.round(
              ((product.was_price! - product.price) / product.was_price!) * 100,
          )
        : null;

    return (
        <li
            className={cn(
                'flex',
                out ? 'justify-end' : 'justify-start',
                className,
            )}
        >
            <div className="flex max-w-xs gap-3 rounded-card border border-border bg-surface p-2">
                <div className="w-16 shrink-0 overflow-hidden rounded-tile">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt=""
                            className="aspect-square size-full object-cover"
                        />
                    ) : (
                        <div
                            aria-hidden="true"
                            className="grid aspect-square w-full place-items-center bg-brand-100 text-brand-700"
                        >
                            <Package className="size-6 stroke-[1.25]" />
                        </div>
                    )}
                </div>
                <div className="grid min-w-0 flex-1 content-center gap-1">
                    <p className="line-clamp-2 text-body-sm">
                        <Link
                            href={productShow.url(product.slug)}
                            className="hover:underline"
                        >
                            {product.name}
                        </Link>
                    </p>
                    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="sr-only">Sale price:</span>
                        <span
                            data-price
                            className="text-body font-extrabold text-sale"
                        >
                            {formatPeso(product.price)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="sr-only">Original price:</span>
                                <s
                                    data-price
                                    className="text-body-sm text-muted-foreground"
                                >
                                    {formatPeso(product.was_price!)}
                                </s>
                                <span className="badge badge-sale">
                                    -{discountPct}%
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </li>
    );
}

export interface ChatOrderCardProps {
    order: ChatOrderSummary;
    out?: boolean;
    className?: string;
}

export function ChatOrderCard({
    order,
    out = false,
    className,
}: ChatOrderCardProps) {
    const statusVariant =
        order.status === 'completed'
            ? 'success'
            : order.status === 'cancelled'
              ? 'danger'
              : 'warning';

    return (
        <li
            className={cn(
                'flex',
                out ? 'justify-end' : 'justify-start',
                className,
            )}
        >
            <div className="grid max-w-xs gap-2 rounded-card border border-border bg-surface p-3">
                <p className="flex items-center justify-between gap-2">
                    <span className="text-label">
                        Order <span className="tabular">#{order.id}</span>
                    </span>
                    <Badge variant={statusVariant}>
                        {order.status.replace('_', ' ')}
                    </Badge>
                </p>
                <p className="text-body-sm text-muted-foreground">
                    {order.items_count != null && (
                        <span>{order.items_count} items · </span>
                    )}
                    <span className="tabular font-bold text-foreground">
                        {formatPeso(order.total)}
                    </span>
                </p>
                <p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/account/orders/${order.id}`}>
                            View order
                        </Link>
                    </Button>
                </p>
            </div>
        </li>
    );
}
