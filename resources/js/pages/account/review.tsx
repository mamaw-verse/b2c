import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { ReviewForm } from '@/components/review-form';

type ReviewPageProps = {
    orderItem: {
        id: string;
        order_id: string;
        product_name: string;
        variation_label?: string | null;
        product?: {
            id: string;
            images?: { url: string }[];
        };
    };
};

export default function ReviewPage({ orderItem }: ReviewPageProps) {
    return (
        <>
            <Head title="Write a Review" />

            <div className="mx-auto max-w-2xl">
                <Link
                    href={`/account/orders/${orderItem.order_id}`}
                    className="mb-4 inline-flex items-center gap-1 text-body-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="size-4" />
                    <span>Back to Order</span>
                </Link>

                <div className="rounded-panel border border-border bg-surface p-4 md:p-6">
                    <header className="mb-6">
                        <h1 className="text-h2">Rate & Review</h1>
                        <p className="mt-1 text-body text-muted-foreground">
                            Help the halal community by sharing your honest
                            feedback about this product.
                        </p>
                    </header>

                    <ReviewForm
                        orderItem={{
                            id: orderItem.id,
                            product_name: orderItem.product_name,
                            variation_label: orderItem.variation_label,
                            image_url: orderItem.product?.images?.[0]?.url,
                        }}
                        actionUrl={`/account/order-items/${orderItem.id}/reviews`}
                    />
                </div>
            </div>
        </>
    );
}

ReviewPage.layout = {
    breadcrumbs: [
        { title: 'My Purchases', href: '/account/orders' },
        { title: 'Write Review', href: '#' },
    ],
};
