import { Link, usePage } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { type PropsWithChildren } from 'react';
import WorkspaceShell from '@/layouts/workspace-shell';
import { ShopSwitcher } from '@/components/shop-switcher';
import { Button } from '@/components/ui/button';
import { show as shopShow } from '@/routes/shops';
import type { AppLayoutProps } from '@/types';

type SellerLayoutProps = {
    title?: string;
    unreadOrders?: number;
};

export default function SellerLayout({
    children,
    unreadOrders = 0,
}: PropsWithChildren<SellerLayoutProps>) {
    const { unreadCounts, seller } = usePage<AppLayoutProps>().props;

    return (
        <WorkspaceShell
            workspace="seller"
            badges={{
                orders: unreadOrders,
                chat: unreadCounts?.chat ?? 0,
            }}
            headerExtra={
                <>
                    <ShopSwitcher />
                    {seller?.status === 'approved' && !seller.suspended && (
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="max-sm:hidden"
                        >
                            <Link
                                href={shopShow(seller.shop_slug).url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View shop
                                <ExternalLink
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Link>
                        </Button>
                    )}
                </>
            }
        >
            {children}
        </WorkspaceShell>
    );
}
