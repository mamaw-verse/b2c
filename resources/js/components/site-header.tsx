import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Bell, MessageCircle, ShoppingCart } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AccountUserMenu } from '@/components/account-user-menu';
import { NameAvatar } from '@/components/name-avatar';
import { SearchInput } from '@/components/search-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index as chatIndex } from '@/routes/chat';
import { login } from '@/routes';
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
        name,
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

    const logo = (
        <Link
            href={home()}
            aria-label={`${name} home`}
            data-edge="start"
            className="flex min-h-touch min-w-touch shrink-0 items-center gap-2 text-h4 text-primary-text max-md:hidden"
        >
            <img
                src="/images/brand/logo.png"
                alt={name}
                className="hidden h-8 w-auto object-contain lg:block dark:hidden"
            />
            <img
                src="/images/brand/logo-dark.png"
                alt={name}
                className="hidden h-8 w-auto object-contain dark:lg:block"
            />
            <img
                src="/images/brand/icon.png"
                alt=""
                aria-hidden="true"
                className="size-8 object-contain lg:hidden"
            />
            <span className="sr-only lg:hidden">{name}</span>
        </Link>
    );

    return (
        <header className="sticky top-0 z-header border-b border-border bg-surface/80 pt-safe backdrop-blur-md">
            {marketplace?.announcement && (
                <div className="hidden min-h-[var(--announce-h)] items-center bg-surface-inverse text-caption text-foreground-inverse lg:flex">
                    <p className="page w-full">{marketplace.announcement}</p>
                </div>
            )}
            <div className="page flex h-header items-center gap-2 md:gap-3 lg:gap-6">
                {back ? (
                    <>
                        <IconButton
                            icon={<ArrowLeft aria-hidden="true" />}
                            label="Back"
                            className="-ml-2"
                            onClick={() => window.history.back()}
                        />
                        <span className="hidden lg:inline">{logo}</span>
                    </>
                ) : (
                    logo
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
                    <div className="min-w-0 flex-1">
                        <SearchInput
                            suggestions={searchSuggestions ?? []}
                            recent="Recent searches"
                            placeholder="Search halal products"
                            className="max-w-2xl"
                        />
                    </div>
                )}
                <div className="flex shrink-0 items-center" data-edge="end">
                    <span className="hidden lg:block">
                        <ThemeToggle />
                    </span>
                    <Link
                        href="/cart"
                        aria-label={`Cart${cartItems > 0 ? `, ${cartItems}` : ''}`}
                        className="btn btn-icon btn-ghost relative text-foreground"
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
                    {!isAdmin && (
                        <span className="lg:hidden">
                            <Link
                                href={auth.user ? chatIndex().url : login().url}
                                aria-label={`Chat${chatUnread > 0 ? `, ${chatUnread} unread` : ''}`}
                                className="btn btn-icon btn-ghost relative text-foreground"
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
                        </span>
                    )}
                    <span className="hidden items-center gap-1 lg:flex">
                        {!isAdmin && (
                            <Link
                                href={
                                    auth.user
                                        ? notificationsIndex().url
                                        : login().url
                                }
                                aria-label={`Notifications${notifUnread > 0 ? `, ${notifUnread} unread` : ''}`}
                                className="btn btn-icon btn-ghost relative text-foreground"
                            >
                                <Bell aria-hidden="true" />
                                {notifUnread > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-caption leading-5 text-primary-foreground"
                                    >
                                        {notifUnread > 99 ? '99+' : notifUnread}
                                    </span>
                                )}
                            </Link>
                        )}
                        {auth.user ? (
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
                                                i === 0 ? 'start' : undefined
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
    );
}
