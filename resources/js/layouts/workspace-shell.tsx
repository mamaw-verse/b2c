import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { AccountUserMenu } from '@/components/account-user-menu';
import {
    PortalBottomTabs,
    type PortalTabItem,
} from '@/components/portal-bottom-tabs';
import { Drawer } from '@/components/ui/drawer';
import {
    useWorkspaceEntries,
    WorkspaceSwitcherList,
} from '@/components/workspace-switcher';
import { cn } from '@/lib/utils';
import {
    editorWorkspace,
    flatNav,
    navItemActive,
    sellerHome,
    workspaces,
    type WorkspaceKey,
    type WorkspaceNavItem,
} from '@/lib/workspaces';
import { index as buyerNotifications } from '@/routes/notifications';
import { index as sellerNotifications } from '@/routes/seller/notifications';
import type { AppLayoutProps } from '@/types';

type NavItem = WorkspaceNavItem & { badge?: number };

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
    const isActive = navItemActive(item, currentPath);

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
            <span className={cn('flex-1 truncate', !full && 'max-lg:sr-only')}>
                {item.label}
            </span>
            {!!item.badge && (
                <span
                    className={cn(
                        'badge badge-solid shrink-0',
                        !full && 'hidden lg:inline-flex',
                    )}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

const shellNames: Record<WorkspaceKey, string> = {
    buyer: 'app',
    seller: 'seller',
    admin: 'admin',
};

/** One shell for every workspace: skip link, branded header with
 * notifications and the user menu, icon/expanded sidebar, phone bottom
 * tabs and an overflow drawer holding the workspace switcher. */
export default function WorkspaceShell({
    workspace,
    badges = {},
    headerExtra,
    children,
}: PropsWithChildren<{
    workspace: WorkspaceKey;
    badges?: Partial<Record<'orders' | 'chat' | 'queue', number>>;
    headerExtra?: ReactNode;
}>) {
    const { name, unreadCounts, pendingQueueCount, seller, auth } =
        usePage<AppLayoutProps>().props;
    const notifUnread = unreadCounts?.notifications ?? 0;
    const [navOpen, setNavOpen] = useState(false);
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    // Invited blog editors enter the Admin workspace for the blog screens only (docs/planning/15-blog.md §6.5).
    const isEditor = workspace === 'admin' && auth?.user?.role === 'editor';
    const config = isEditor
        ? { ...workspaces.admin, ...editorWorkspace }
        : workspaces[workspace];
    const notificationsHref =
        workspace === 'seller'
            ? sellerNotifications().url
            : buyerNotifications().url;

    const sellerRole =
        workspace === 'seller'
            ? (seller?.role as 'owner' | 'staff' | undefined)
            : undefined;

    const homeHref =
        workspace === 'seller' ? sellerHome(sellerRole) : config.home;

    const navItems: NavItem[] = flatNav(
        workspace,
        sellerRole,
        isEditor ? 'editor' : 'admin',
    ).map((item) => ({
        ...item,
        badge:
            item.badgeKey === 'queue'
                ? (badges.queue ?? pendingQueueCount ?? 0)
                : item.badgeKey
                  ? badges[item.badgeKey]
                  : undefined,
    }));
    const tabItems: PortalTabItem[] = navItems;

    const switcherEntries = useWorkspaceEntries();

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
            <header
                data-shell={shellNames[workspace]}
                className="sticky top-0 z-header border-b border-border bg-surface pt-safe"
            >
                <div className="flex h-header items-center gap-2 px-gutter">
                    {/* Logo */}
                    <Link
                        href={homeHref}
                        className="flex min-h-touch min-w-0 items-center gap-2 rounded-button text-h4 text-primary-text"
                    >
                        <span className="flex">
                            <img
                                src="/images/brand/logo.png"
                                alt={name}
                                className="h-8 w-auto object-contain md:h-9 dark:hidden"
                            />
                            <img
                                src="/images/brand/logo-dark.png"
                                alt={name}
                                className="hidden h-8 w-auto object-contain md:h-9 dark:block"
                            />
                        </span>
                        <span className="shrink-0 rounded-badge border border-border px-2 py-0.5 text-eyebrow whitespace-nowrap text-muted-foreground uppercase">
                            {config.label}
                        </span>
                    </Link>

                    <div className="ml-auto flex items-center gap-1">
                        {headerExtra}

                        {/* Notifications — the admin workspace has no
                            notifications surface, so the bell is hidden. */}
                        {workspace !== 'admin' && (
                            <Link
                                href={notificationsHref}
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
                        )}

                        {/* User menu with workspace switcher */}
                        <AccountUserMenu />
                    </div>
                </div>
            </header>

            {/* Sidebar (md+) */}
            <aside
                data-shell={shellNames[workspace]}
                className="fixed top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] bottom-0 left-0 hidden w-18 border-r border-border bg-surface md:block lg:w-[var(--sidebar-w)]"
            >
                <div className="flex h-full flex-col p-2 lg:p-3">
                    <nav
                        aria-label={`${config.label} navigation`}
                        className="flex-1"
                    >
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
                </div>
            </aside>

            {/* Phone bottom tabs + overflow drawer */}
            <PortalBottomTabs
                items={tabItems.slice(0, 3)}
                menuItems={tabItems.slice(3)}
                onMenu={() => setNavOpen(true)}
            />
            <Drawer
                open={navOpen}
                onOpenChange={setNavOpen}
                title={`${config.label} menu`}
            >
                <div className="flex flex-col gap-4">
                    {switcherEntries.length > 1 && (
                        <div>
                            <p className="px-3 pt-2 pb-1 text-eyebrow text-muted-foreground uppercase">
                                Workspaces
                            </p>
                            <WorkspaceSwitcherList
                                onNavigate={() => setNavOpen(false)}
                            />
                        </div>
                    )}
                    <nav
                        aria-label={`${config.label} navigation`}
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
                </div>
            </Drawer>

            {/* Main content */}
            <main
                id="main"
                data-shell={shellNames[workspace]}
                className="flex min-h-[calc(100dvh-var(--header-h)-env(safe-area-inset-top,0px))] min-w-0 flex-col pb-tabbar md:ps-18 lg:ps-[var(--sidebar-w)]"
            >
                <div className="min-w-0 flex-1">{children}</div>
                <p className="mx-auto w-full max-w-container px-gutter py-6 text-right text-caption text-muted-foreground">
                    © {new Date().getFullYear()} {name}
                </p>
            </main>
        </>
    );
}
