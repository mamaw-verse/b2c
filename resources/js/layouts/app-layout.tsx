import { Link, usePage } from '@inertiajs/react';
import { useState, type PropsWithChildren } from 'react';
import {
    AccountNavLinks,
    AccountSidebar,
    accountNavItems,
} from '@/components/account-sidebar';
import { AccountUserMenu } from '@/components/account-user-menu';
import { BrandMark } from '@/components/brand-mark';
import { PortalBottomTabs } from '@/components/portal-bottom-tabs';
import { Drawer } from '@/components/ui/drawer';
import { dashboard } from '@/routes';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({
    children,
}: PropsWithChildren<AppLayoutProps>) {
    const { name } = usePage().props;
    const [navigationOpen, setNavigationOpen] = useState(false);

    return (
        <div className="flex min-h-dvh flex-col">
            <a
                href="#main"
                className="fixed top-2 left-2 z-toast flex min-h-touch -translate-y-24 items-center rounded-button bg-primary px-4 text-label text-primary-foreground focus:translate-y-0"
            >
                Skip to content
            </a>
            <header className="sticky top-0 z-header border-b border-border bg-surface pt-safe">
                <div className="mx-auto flex h-header max-w-container items-center gap-2 px-gutter">
                    <Link
                        href={dashboard()}
                        className="flex min-h-touch items-center"
                        aria-label={`${name} account home`}
                    >
                        <BrandMark name={name} showName={false} />
                        <span className="sr-only lg:not-sr-only lg:ml-2 lg:text-h4 lg:text-primary-text">
                            {name}
                        </span>
                    </Link>
                    <div className="ml-auto flex items-center gap-1">
                        <AccountUserMenu />
                    </div>
                </div>
            </header>

            <main
                id="main"
                data-shell="app"
                className="flex flex-1 flex-col pb-tabbar"
            >
                <div className="mx-auto flex w-full max-w-container flex-1 md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
                    <div className="hidden border-r border-border md:block">
                        <div className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] flex h-[calc(100dvh-var(--header-h)-env(safe-area-inset-top,0px))] flex-col px-2 py-4 lg:px-3">
                            <div className="flex-1">
                                <AccountSidebar />
                            </div>
                            <p className="hidden pt-4 text-caption text-muted-foreground lg:block">
                                © {new Date().getFullYear()} {name}
                            </p>
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex-1 p-gutter md:p-6 lg:p-8">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            <PortalBottomTabs
                items={accountNavItems.slice(0, 3)}
                menuItems={accountNavItems.slice(3)}
                onMenu={() => setNavigationOpen(true)}
            />
            <Drawer
                open={navigationOpen}
                onOpenChange={setNavigationOpen}
                title="My account"
            >
                <nav
                    aria-label="Account"
                    onClick={() => setNavigationOpen(false)}
                >
                    <AccountNavLinks full items={accountNavItems.slice(3)} />
                </nav>
            </Drawer>
        </div>
    );
}
