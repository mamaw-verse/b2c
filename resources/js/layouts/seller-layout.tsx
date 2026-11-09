import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import WorkspaceShell from '@/layouts/workspace-shell';
import type { AppLayoutProps } from '@/types';

type SellerLayoutProps = {
    title?: string;
    unreadOrders?: number;
    shop?: { name: string; slug: string; logo_url?: string | null };
};

export default function SellerLayout({
    children,
    unreadOrders = 0,
    shop,
}: PropsWithChildren<SellerLayoutProps>) {
    const { unreadCounts } = usePage<AppLayoutProps>().props;

    return (
        <WorkspaceShell
            workspace="seller"
            badges={{
                orders: unreadOrders,
                chat: unreadCounts?.chat ?? 0,
            }}
            headerExtra={
                shop ? (
                    <Link
                        href={`/shops/${shop.slug}`}
                        className="btn btn-ghost hidden text-label lg:inline-flex"
                    >
                        View shop
                    </Link>
                ) : undefined
            }
        >
            {children}
        </WorkspaceShell>
    );
}
