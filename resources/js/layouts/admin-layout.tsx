import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Flag,
    Gauge,
    Inbox,
    ScrollText,
    Settings,
    Shield,
    Users,
} from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';
import {
    PortalBottomTabs,
    type PortalTabItem,
} from '@/components/portal-bottom-tabs';
import { Drawer } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import type { AppLayoutProps } from '@/types';

type AdminLayoutProps = {
    title?: string;
    pendingQueueCount?: number;
    unreadNotifications?: number;
};

type NavItem = PortalTabItem;

function getNavItems(pendingQueueCount?: number): NavItem[] {
    return [
        {
            label: 'Dashboard',
            href: '/admin/dashboard',
            icon: Gauge,
            matchPrefix: '/admin/dashboard',
        },
        {
            label: 'Queue',
            href: '/admin/moderation',
            icon: Inbox,
            badge: pendingQueueCount,
            matchPrefix: '/admin/moderation',
        },
        {
            label: 'Reports',
            href: '/admin/moderation?type=report',
            icon: Flag,
            matchPrefix: '/admin/reports',
        },
        {
            label: 'Users',
            href: '#',
            icon: Users,
            matchPrefix: '#',
        },
        {
            label: 'Audit log',
            href: '#',
            icon: ScrollText,
            matchPrefix: '#',
        },
        {
            label: 'Settings',
            href: '#',
            icon: Settings,
            matchPrefix: '#',
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
            title={item.label}
            className={cn(
                'relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label transition-colors',
                isActive
                    ? 'bg-primary-soft font-semibold text-primary-soft-foreground'
                    : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                !full && 'md:justify-center lg:justify-start',
            )}
        >
            <span className="relative shrink-0">
                <Icon aria-hidden="true" className="size-5" />
                {!!item.badge && !full && (
                    <span className="badge badge-solid absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-caption md:hidden">
                        {item.badge > 99 ? '99+' : item.badge}
                    </span>
                )}
            </span>
            <span
                className={cn(
                    'flex-1 truncate',
                    !full && 'md:sr-only lg:not-sr-only',
                )}
            >
                {item.label}
            </span>
            {!!item.badge && (
                <span
                    className={cn(
                        'badge badge-solid',
                        !full && 'hidden lg:inline-flex',
                    )}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

export default function AdminLayout({
    children,
    pendingQueueCount,
    unreadNotifications,
}: PropsWithChildren<AdminLayoutProps>) {
    const { name, auth, unreadCounts } = usePage<AppLayoutProps>().props;
    const notifUnread = unreadCounts?.notifications ?? unreadNotifications ?? 0;
    const [navOpen, setNavOpen] = useState(false);
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems = getNavItems(pendingQueueCount);
    const adminUser = auth?.user;
    const adminInitials = adminUser?.name
        ? adminUser.name.slice(0, 2).toUpperCase()
        : 'AD';

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
                        href="/admin/dashboard"
                        className="flex min-h-touch min-w-0 items-center gap-2 rounded-button text-h4 text-primary-text"
                        aria-label={`${name ?? 'Amanah'} Admin`}
                    >
                        <span
                            className="grid size-8 shrink-0 place-items-center rounded-tile bg-primary text-primary-foreground"
                            aria-hidden="true"
                        >
                            <Shield className="size-5" />
                        </span>
                        <span className="truncate">
                            {name ?? 'Amanah'}{' '}
                            <span className="font-normal text-muted-foreground">
                                · Admin
                            </span>
                        </span>
                    </Link>

                    <div className="ml-auto flex items-center gap-1">
                        {/* Notifications */}
                        <Link
                            href="/notifications"
                            className="btn btn-icon btn-ghost relative text-foreground"
                            aria-label={
                                notifUnread > 0
                                    ? `Notifications, ${notifUnread}`
                                    : 'Notifications'
                            }
                        >
                            <Bell aria-hidden="true" className="size-5" />
                            {notifUnread > 0 && (
                                <span
                                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-caption leading-5 text-primary-foreground"
                                    aria-hidden="true"
                                >
                                    {notifUnread}
                                </span>
                            )}
                        </Link>

                        {/* Admin profile */}
                        <div className="flex min-h-touch items-center gap-2 rounded-button px-2 text-label">
                            <span
                                className="relative inline-grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-caption font-bold text-success-text"
                                aria-hidden="true"
                            >
                                <span>{adminInitials}</span>
                            </span>
                            <span className="hidden font-medium text-foreground md:inline">
                                {adminUser?.name ?? 'Admin'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sidebar (md+) */}
            <aside className="fixed top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] bottom-0 left-0 hidden w-18 border-r border-border bg-surface md:block lg:w-[var(--sidebar-w)]">
                <div className="flex h-full flex-col p-2 lg:p-3">
                    <nav aria-label="Admin navigation" className="flex-1">
                        <ul className="grid gap-0.5">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <NavLink
                                        item={item}
                                        currentPath={currentPath}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <p className="hidden pt-4 text-caption text-muted-foreground lg:block">
                        © {new Date().getFullYear()} {name ?? 'Amanah'}
                    </p>
                </div>
            </aside>

            {/* Phone bottom tabs + overflow drawer */}
            <PortalBottomTabs
                items={navItems.slice(0, 3)}
                menuItems={navItems.slice(3)}
                onMenu={() => setNavOpen(true)}
            />
            <Drawer open={navOpen} onOpenChange={setNavOpen} title="Admin menu">
                <nav
                    aria-label="Admin navigation"
                    className="flex flex-col gap-1"
                >
                    <ul className="grid gap-0.5">
                        {navItems.slice(3).map((item) => (
                            <li key={item.label}>
                                <NavLink
                                    item={item}
                                    full
                                    currentPath={currentPath}
                                    onClick={() => setNavOpen(false)}
                                />
                            </li>
                        ))}
                    </ul>
                </nav>
            </Drawer>

            {/* Main content */}
            <main
                id="main"
                data-shell="admin"
                className="min-w-0 pb-tabbar md:ps-18 lg:ps-[var(--sidebar-w)]"
            >
                {children}
            </main>
        </>
    );
}
