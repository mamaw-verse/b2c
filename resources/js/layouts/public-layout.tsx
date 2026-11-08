import type { PropsWithChildren, ReactNode } from 'react';
import { SiteBottomTabs, type TabName } from '@/components/site-bottom-tabs';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { cn } from '@/lib/utils';

type PublicLayoutProps = {
    activeTab?: TabName;
    tabBar?: boolean;
    back?: boolean;
    title?: string;
    desktopNav?: boolean;
    children: ReactNode;
};

export default function PublicLayout({
    activeTab = 'Home',
    tabBar = true,
    back = false,
    title,
    desktopNav = true,
    children,
}: PropsWithChildren<PublicLayoutProps>) {
    return (
        <div className="flex min-h-dvh flex-col">
            <a
                href="#main"
                className="fixed top-2 left-2 z-toast flex min-h-touch -translate-y-24 items-center rounded-button bg-primary px-4 text-label text-primary-foreground focus:translate-y-0"
            >
                Skip to content
            </a>
            <SiteHeader back={back} title={title} desktopNav={desktopNav} />
            <main
                id="main"
                data-shell="public"
                className={cn(
                    'flex-1',
                    tabBar
                        ? 'pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))]'
                        : 'pb-sticky-bar',
                    'lg:pb-8',
                )}
            >
                <div className="page">{children}</div>
            </main>
            <SiteFooter />
            {tabBar && <SiteBottomTabs active={activeTab} />}
        </div>
    );
}
