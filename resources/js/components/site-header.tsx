import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Bell, MessageCircle, ShoppingCart } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { AccountUserMenu } from '@/components/account-user-menu';
import { NameAvatar } from '@/components/name-avatar';
import { SearchInput } from '@/components/search-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { index as chatIndex } from '@/routes/chat';
import { index as notificationsIndex } from '@/routes/notifications';
import { show as categoryShow } from '@/routes/categories';
import { index as sellersIndex } from '@/routes/shops';

/** One style for every link in the category nav: constant weight (no layout
   shift), brand hover pill, bottom-bar indicator when current, and the shared
   focus ring. The ::before expands the hit area into the row's margins. */
const navLink = (active: boolean) =>
    cn(
        'relative my-1 flex items-center rounded-button px-3 text-body-sm font-medium whitespace-nowrap text-muted-foreground',
        'before:absolute before:-inset-y-0.5 before:content-[""]',
        'hover:bg-brand-50 hover:text-nav-active dark:hover:bg-surface-muted',
        active &&
            'text-nav-active after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:bg-primary-text after:content-[""]',
    );

type SiteHeaderProps = {
    back?: boolean;
    title?: string;
    desktopNav?: boolean;
};

export function SiteHeader({
    back = false,
    title,
    desktopNav = true,
}: SiteHeaderProps) {
    const {
        auth,
        navCategories,
        unreadCounts,
        cartCount,
        searchSuggestions,
        marketplace,
        workspaces,
    } = usePage().props;
    const { url } = usePage();
    // Buyer and seller surfaces are stripped for admins — hide the
    // storefront entries that lead into them.
    const isAdmin = (workspaces ?? []).some((w) => w.key === 'admin');
    const chatUnread = unreadCounts?.chat ?? 0;
    const notifUnread = unreadCounts?.notifications ?? 0;
    const cartItems = cartCount ?? 0;

    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY >= 48);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const path = url.split('?')[0];
    const activeSlug = path.startsWith('/categories/')
        ? decodeURIComponent(path.slice('/categories/'.length))
        : null;
    const activeLinkRef = useRef<HTMLAnchorElement>(null);
    useEffect(() => {
        activeLinkRef.current?.scrollIntoView({
            block: 'nearest',
            inline: 'center',
        });
    }, [activeSlug]);

    const handleLogoClick = (e: React.MouseEvent) => {
        if (window.location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const wordmarkLink = (
        <Link
            href="/"
            onClick={handleLogoClick}
            aria-label="HalalBenta home"
            data-edge="start"
            className="flex min-h-touch items-center gap-2 rounded-button"
        >
            <img
                src="/brand/halalbenta-wordmark.svg"
                alt="HalalBenta"
                className="h-7 w-auto object-contain md:h-8 dark:hidden"
            />
            <img
                src="/brand/halalbenta-wordmark-dark.svg"
                alt="HalalBenta"
                className="hidden h-7 w-auto object-contain md:h-8 dark:block"
            />
        </Link>
    );

    const squareMarkLink = (
        <Link
            href="/"
            onClick={handleLogoClick}
            aria-label="HalalBenta home"
            data-edge="start"
            className="flex size-11 min-h-touch min-w-touch shrink-0 items-center justify-center rounded-button"
        >
            <img
                src="/brand/halalbenta-mark.svg"
                alt=""
                aria-hidden="true"
                className="size-8 object-contain dark:hidden"
            />
            <img
                src="/brand/halalbenta-mark-dark.svg"
                alt=""
                aria-hidden="true"
                className="hidden size-8 object-contain dark:block"
            />
        </Link>
    );

    const cartButton = (
        <Link
            href="/cart"
            aria-label={`Cart${cartItems > 0 ? `, ${cartItems}` : ''}`}
            className="btn btn-icon btn-ghost relative flex min-h-touch min-w-touch items-center justify-center text-foreground"
        >
            <ShoppingCart aria-hidden="true" />
            {cartItems > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-promo-solid-bg px-1 text-caption leading-5 text-primary-foreground"
                >
                    {cartItems > 99 ? '99+' : cartItems}
                </span>
            )}
        </Link>
    );

    const chatButton = !isAdmin && (
        <Link
            href={auth?.user ? chatIndex().url : login().url}
            aria-label={`Chat${chatUnread > 0 ? `, ${chatUnread} unread` : ''}`}
            className="btn btn-icon btn-ghost relative flex min-h-touch min-w-touch items-center justify-center text-foreground"
        >
            <MessageCircle aria-hidden="true" />
            {chatUnread > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-caption leading-5 text-primary-foreground"
                >
                    {chatUnread > 99 ? '99+' : chatUnread}
                </span>
            )}
        </Link>
    );

    const reservedHeight = desktopNav ? '8.25rem' : '5.75rem';

    return (
        <div
            className="header-wrapper"
            style={
                {
                    '--header-reserved-h': `calc(${reservedHeight} + env(safe-area-inset-top, 0px))`,
                } as React.CSSProperties
            }
        >
            {/* Height reservation spacer on mobile so category chips and content never shift */}
            {!title && (
                <div
                    className="header-spacer hidden max-md:block"
                    style={{ height: 'var(--header-reserved-h)' }}
                    aria-hidden="true"
                />
            )}
            <header
                className={cn(
                    'z-header border-b border-border bg-surface/80 pt-safe backdrop-blur-md',
                    title ? 'sticky top-0' : 'fixed inset-x-0 top-0 md:sticky',
                )}
            >
                {marketplace?.announcement && (
                    <div className="hidden min-h-[var(--announce-h)] items-center bg-surface-inverse text-caption text-foreground-inverse lg:flex">
                        <p className="page w-full">
                            {marketplace.announcement}
                        </p>
                    </div>
                )}

                {/* Mobile Row 1 (sm only, hidden on md+) when no title */}
                {!title && (
                    <div
                        className={cn(
                            'page flex items-center justify-between overflow-hidden motion-safe:transition-all motion-safe:duration-200 md:hidden',
                            scrolled
                                ? 'pointer-events-none my-0 max-h-0 -translate-y-2 py-0 opacity-0'
                                : 'h-11 max-h-11 translate-y-0 py-1.5 opacity-100',
                        )}
                    >
                        <div className="flex items-center">{wordmarkLink}</div>
                        <div className="flex items-center gap-1">
                            {cartButton}
                            {chatButton}
                        </div>
                    </div>
                )}

                {/* Main Row: Row 2 on sm (collapsible into single sticky row), single row on md/lg */}
                <div className="page flex h-header items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-6">
                    {back ? (
                        <>
                            <IconButton
                                icon={<ArrowLeft aria-hidden="true" />}
                                label="Back"
                                className="-ml-2"
                                onClick={() => window.history.back()}
                            />
                            <span className="hidden lg:inline">
                                {wordmarkLink}
                            </span>
                        </>
                    ) : (
                        <>
                            {/* Mobile: Square mark appears when scrolled */}
                            {!title && (
                                <div
                                    className={cn(
                                        'flex items-center motion-safe:transition-all motion-safe:duration-200 md:hidden',
                                        scrolled
                                            ? 'w-11 translate-x-0 opacity-100'
                                            : 'pointer-events-none w-0 -translate-x-2 overflow-hidden opacity-0',
                                    )}
                                >
                                    {squareMarkLink}
                                </div>
                            )}

                            {/* Tablet (md: 768px-1023px): Wordmark, falling back to square mark only if search < 320px */}
                            <div className="hidden shrink-0 items-center md:flex lg:hidden">
                                <span
                                    className={cn(
                                        title && back
                                            ? 'hidden min-[860px]:inline-flex'
                                            : 'inline-flex',
                                    )}
                                >
                                    {wordmarkLink}
                                </span>
                                <span
                                    className={cn(
                                        title && back
                                            ? 'inline-flex min-[860px]:hidden'
                                            : 'hidden',
                                    )}
                                >
                                    {squareMarkLink}
                                </span>
                            </div>

                            {/* Desktop (lg: >= 1024px): Wordmark */}
                            <div className="hidden shrink-0 items-center lg:flex">
                                {wordmarkLink}
                            </div>
                        </>
                    )}

                    {title ? (
                        <>
                            <h1 className="min-w-0 flex-1 truncate text-h4 lg:hidden">
                                {title}
                            </h1>
                            <div className="hidden flex-1 lg:block">
                                <SearchInput
                                    suggestions={searchSuggestions ?? []}
                                    placeholder="Search halal products"
                                    className="max-w-2xl"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="min-w-[200px] flex-1">
                            <SearchInput
                                suggestions={searchSuggestions ?? []}
                                recent="Recent searches"
                                placeholder="Search halal products"
                                className="max-w-2xl"
                            />
                        </div>
                    )}

                    {/* Right side icons */}
                    <div className="flex shrink-0 items-center" data-edge="end">
                        <span className="hidden lg:block">
                            <ThemeToggle />
                        </span>

                        {/* On mobile: only show in this row when scrolled (when not scrolled, they are in Row 1) */}
                        <div
                            className={cn(
                                'flex items-center gap-1 motion-safe:transition-all motion-safe:duration-200 lg:gap-2',
                                !title && 'max-md:overflow-hidden',
                                !title &&
                                    (scrolled
                                        ? 'max-md:w-auto max-md:translate-x-0 max-md:opacity-100'
                                        : 'max-md:pointer-events-none max-md:w-0 max-md:translate-x-2 max-md:opacity-0'),
                            )}
                        >
                            {cartButton}
                            {chatButton}
                        </div>

                        {/* Desktop notifications and account */}
                        <span className="hidden items-center gap-1 lg:flex">
                            {!isAdmin && (
                                <Link
                                    href={
                                        auth?.user
                                            ? notificationsIndex().url
                                            : login().url
                                    }
                                    aria-label={`Notifications${notifUnread > 0 ? `, ${notifUnread} unread` : ''}`}
                                    className="btn btn-icon btn-ghost relative flex min-h-touch min-w-touch items-center justify-center text-foreground"
                                >
                                    <Bell aria-hidden="true" />
                                    {notifUnread > 0 && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-caption leading-5 text-primary-foreground"
                                        >
                                            {notifUnread > 99
                                                ? '99+'
                                                : notifUnread}
                                        </span>
                                    )}
                                </Link>
                            )}
                            {auth?.user ? (
                                <AccountUserMenu />
                            ) : (
                                <Link
                                    href={login()}
                                    className="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted"
                                >
                                    <NameAvatar
                                        name="Guest"
                                        size="sm"
                                        label={false}
                                    />
                                    <span>Log in</span>
                                </Link>
                            )}
                        </span>
                    </div>
                </div>

                {desktopNav && (
                    <nav
                        aria-label="Categories"
                        className="border-t border-border lg:h-[var(--nav-h)]"
                    >
                        <div className="page h-full">
                            <ul className="-mx-3 flex h-full [scrollbar-width:none] items-stretch gap-1 overflow-x-auto max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] max-lg:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]">
                                <li className="flex">
                                    <Link
                                        href={sellersIndex().url}
                                        className={navLink(path === '/sellers')}
                                    >
                                        Sellers
                                    </Link>
                                </li>
                                {navCategories.map((c, i) => {
                                    const active =
                                        activeSlug === c.slug ||
                                        (activeSlug?.startsWith(`${c.slug}-`) ??
                                            false);
                                    return (
                                        <li key={c.id} className="flex">
                                            <Link
                                                href={categoryShow.url(c.slug)}
                                                ref={
                                                    active
                                                        ? activeLinkRef
                                                        : undefined
                                                }
                                                aria-current={
                                                    active ? 'page' : undefined
                                                }
                                                data-edge={
                                                    i === 0
                                                        ? 'start'
                                                        : undefined
                                                }
                                                className={navLink(active)}
                                            >
                                                {c.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                                {((marketplace?.nav.sell && !isAdmin) ||
                                    marketplace?.nav.help) && (
                                    <li className="ms-auto flex">
                                        {marketplace?.nav.sell && !isAdmin && (
                                            <a
                                                href={marketplace.nav.sell}
                                                className={navLink(false)}
                                            >
                                                Start selling
                                            </a>
                                        )}
                                        {marketplace?.nav.help && (
                                            <a
                                                href={marketplace.nav.help}
                                                className={navLink(false)}
                                            >
                                                Help
                                            </a>
                                        )}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </nav>
                )}
            </header>
        </div>
    );
}
