import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Boxes,
    Gauge,
    MessageCircle,
    Percent,
    Settings,
    ShoppingBag,
    Store,
    Wallet,
} from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';
import {
    PortalBottomTabs,
    type PortalTabItem,
} from '@/components/portal-bottom-tabs';
import { Drawer } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as sellerOrders } from '@/routes/seller/orders';
import { index as sellerProducts } from '@/routes/seller/products';
import { edit as sellerSettings } from '@/routes/seller/settings';
import type { AppLayoutProps } from '@/types';

type SellerLayoutProps = {
    title?: string;
    unreadOrders?: number;
    unreadChats?: number;
    unreadNotifications?: number;
    shop?: { name: string; slug: string; logo_url?: string | null };
};

type NavItem = PortalTabItem;

function getNavItems(unreadOrders: number, unreadChats: number): NavItem[] {
    return [
        {
            label: 'Dashboard',
            href: sellerDashboard().url,
            icon: Gauge,
            matchPrefix: '/seller/dashboard',
        },
        {
            label: 'Orders',
            href: sellerOrders().url,
            icon: ShoppingBag,
            badge: unreadOrders,
            matchPrefix: '/seller/orders',
        },
        {
            label: 'Products',
            href: sellerProducts().url,
            icon: Boxes,
            matchPrefix: '/seller/products',
        },
        {
            label: 'Chats',
            href: '/chat',
            icon: MessageCircle,
            badge: unreadChats,
            matchPrefix: '/chat',
        },
        {
            label: 'Marketing',
            href: '#',
            icon: Percent,
            matchPrefix: '#',
        },
        {
            label: 'Finance',
            href: '#',
            icon: Wallet,
            matchPrefix: '#',
        },
        {
            label: 'Shop settings',
            href: sellerSettings().url,
            icon: Settings,
            matchPrefix: '/seller/settings',
        },
    ];
}

function NavLink({
    item,
    full = false,
    currentPath,
    onClick,
}: {
    item: NavItem;
    full?: boolean;
    currentPath: string;
    onClick?: () => void;
}) {
    const Icon = item.icon;
    const isActive =
        item.matchPrefix !== '#' &&
        currentPath.startsWith(item.matchPrefix ?? item.href);

    return (
        <Link
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onClick}
            className={cn(
                'relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label transition-colors',
                'hover:bg-surface-raised',
                isActive
                    ? 'bg-primary-soft text-primary-text'
                    : 'text-foreground',
                !full && 'md:justify-center lg:justify-start',
            )}
        >
            <span className="relative shrink-0">
                <Icon aria-hidden="true" className="size-5" />
                {!!item.badge && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-danger text-caption font-bold text-white">
                        {item.badge > 9 ? '9+' : item.badge}
                    </span>
                )}
            </span>
            <span className={cn('flex-1 truncate', !full && 'hidden lg:block')}>
                {item.label}
            </span>
        </Link>
    );
}

export default function SellerLayout({
    children,
    unreadOrders = 0,
    unreadChats = 0,
    unreadNotifications,
    shop,
}: PropsWithChildren<SellerLayoutProps>) {
    const { name, unreadCounts } = usePage<AppLayoutProps>().props;
    const notifUnread = unreadCounts?.notifications ?? unreadNotifications ?? 0;
    const [navOpen, setNavOpen] = useState(false);
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems = getNavItems(unreadOrders, unreadChats);

    return (
        <>
            {/* Skip to content */}
            <a
                href="#main"
                className="fixed top-2 left-2 z-toast flex min-h-touch -translate-y-24 items-center rounded-button bg-primary px-4 text-label text-primary-foreground focus:translate-y-0"
            >
                Skip to content
            </a>

            {/* Header */}
            <header className="sticky top-0 z-header border-b border-border bg-surface pt-safe">
                <div className="flex h-header items-center gap-2 px-gutter">
                    {/* Logo */}
                    <Link
                        href={sellerDashboard()}
                        className="flex min-h-touch items-center gap-2 text-primary-text"
                        aria-label={`${name} Seller Centre home`}
                    >
                        <span className="grid size-8 place-items-center rounded-tile bg-primary text-primary-foreground">
                            <Store className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-h4">
                            {name}
                            <span className="text-muted-foreground">
                                {' · '}
                            </span>
                            Seller Centre
                        </span>
                    </Link>

                    <div className="ml-auto flex items-center gap-1">
                        {/* View shop link (lg+) */}
                        {shop && (
                            <Link
                                href={`/shops/${shop.slug}`}
                                className="btn btn-ghost hidden text-label lg:inline-flex"
                            >
                                View shop
                            </Link>
                        )}

                        {/* Notifications bell */}
                        <Link
                            href="/notifications"
                            className="btn btn-icon btn-ghost relative text-foreground"
                            aria-label={
                                notifUnread > 0
                                    ? `${notifUnread} unread notifications`
                                    : 'Notifications'
                            }
                        >
                            <Bell aria-hidden="true" className="size-5" />
                            {notifUnread > 0 && (
                                <span className="absolute top-1 right-1 size-2 rounded-full bg-danger" />
                            )}
                        </Link>

                        {/* Shop avatar */}
                        {shop && (
                            <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-label font-semibold text-primary-text">
                                {shop.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Sidebar (md+) */}
            <aside className="fixed top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] bottom-0 left-0 hidden w-18 border-r border-border bg-surface md:block lg:w-[var(--sidebar-w)]">
                <div className="flex h-full flex-col p-2 lg:p-3">
                    <nav
                        aria-label="Seller Centre navigation"
                        className="flex flex-1 flex-col gap-1"
                    >
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                item={item}
                                currentPath={currentPath}
                            />
                        ))}
                    </nav>
                    <p className="hidden pt-4 text-caption text-muted-foreground lg:block">
                        © {new Date().getFullYear()} {name}
                    </p>
                </div>
            </aside>

            {/* Phone bottom tabs + overflow drawer */}
            <PortalBottomTabs
                items={navItems.slice(0, 3)}
                menuItems={navItems.slice(3)}
                onMenu={() => setNavOpen(true)}
            />
            <Drawer
                open={navOpen}
                onOpenChange={setNavOpen}
                title="Seller Centre menu"
            >
                <nav
                    aria-label="Seller Centre navigation"
                    className="flex flex-col gap-1"
                    onClick={() => setNavOpen(false)}
                >
                    {navItems.slice(3).map((item) => (
                        <NavLink
                            key={item.label}
                            item={item}
                            full
                            currentPath={currentPath}
                            onClick={() => setNavOpen(false)}
                        />
                    ))}
                </nav>
            </Drawer>

            {/* Main content */}
            <main
                id="main"
                data-shell="seller"
                className="min-w-0 pb-tabbar md:ps-18 lg:ps-[var(--sidebar-w)]"
            >
                {children}
            </main>
        </>
    );
}
