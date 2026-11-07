import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';
import { AccountNavLinks, AccountSidebar } from '@/components/account-sidebar';
import { AccountBottomTabs } from '@/components/account-bottom-tabs';
import { AccountUserMenu } from '@/components/account-user-menu';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { dashboard } from '@/routes';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({
    children,
}: PropsWithChildren<AppLayoutProps>) {
    const { name } = usePage().props;
    const [navigationOpen, setNavigationOpen] = useState(false);

    return (
        <>
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
                        <BrandMark
                            name={name}
                            showName={false}
                            className="lg:[&>span:last-child]:inline"
                        />
                        <span className="sr-only lg:not-sr-only lg:ml-2 lg:text-h4 lg:text-primary">
                            {name}
                        </span>
                    </Link>
                    <div className="ml-auto flex items-center gap-1">
                        <AccountUserMenu />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            aria-label="Open account menu"
                            aria-expanded={navigationOpen}
                            onClick={() => setNavigationOpen(true)}
                        >
                            <Menu aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </header>

            <main
                id="main"
                data-shell="app"
                className="pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] lg:pb-0"
            >
                <div className="mx-auto max-w-container md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
                    <div className="hidden border-r border-border py-4 md:block">
                        <div className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] px-2 lg:px-3">
                            <AccountSidebar />
                        </div>
                    </div>
                    <div className="min-w-0 p-gutter md:p-6 lg:p-8">
                        {children}
                    </div>
                </div>
            </main>

            <footer className="hidden border-t border-border bg-surface-subtle md:block">
                <p className="mx-auto max-w-container px-gutter py-6 text-caption text-muted-foreground">
                    © {name}
                </p>
            </footer>

            <AccountBottomTabs />
            <Drawer
                open={navigationOpen}
                onOpenChange={setNavigationOpen}
                title="My account"
            >
                <nav
                    aria-label="Account"
                    onClick={() => setNavigationOpen(false)}
                >
                    <AccountNavLinks full />
                </nav>
            </Drawer>
        </>
    );
}
