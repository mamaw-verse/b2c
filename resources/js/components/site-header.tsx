import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    MessageCircle,
    ShoppingCart,
    Store,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NameAvatar } from '@/components/name-avatar';
import { SearchInput } from '@/components/search-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { dashboard, home } from '@/routes';
import { login } from '@/routes';
import { show as categoryShow } from '@/routes/categories';

/** One style for every link in the category nav: constant weight (no layout
   shift), brand hover pill, bottom-bar indicator when current, and the shared
   focus ring. The ::before expands the hit area into the row's margins. */
const navLink = (active: boolean) =>
    cn(
        'relative my-1 flex items-center rounded-button px-3 text-body-sm font-medium whitespace-nowrap text-muted-foreground',
        'before:absolute before:-inset-y-0.5 before:content-[""]',
        'hover:bg-brand-50 hover:text-brand-700',
        active &&
            'text-brand-700 after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:bg-brand-600 after:content-[""]',
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
    const { name, auth, navCategories, unreadCounts, searchSuggestions } =
        usePage().props;
    const { url } = usePage();
    const chatUnread = unreadCounts?.chat ?? 0;
    const notifUnread = unreadCounts?.notifications ?? 0;

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
            className="flex min-h-touch min-w-touch shrink-0 items-center gap-2 text-h4 text-primary max-md:hidden"
        >
            <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-tile bg-primary text-primary-foreground"
            >
                <Store className="size-5" />
            </span>
            <span className="hidden lg:inline">{name}</span>
        </Link>
    );

    return (
        <header className="sticky top-0 z-header border-b border-border bg-surface pt-safe">
            {/* TODO: Announcement bar — wire to backend (e.g. a shared Inertia prop
                from HandleInertiaRequests) so the text is editable without a deploy.
            <div className="hidden min-h-[var(--announce-h)] items-center bg-surface-inverse text-caption text-foreground-inverse lg:flex">
                <p className="mx-auto w-full max-w-container px-gutter">
                    Free shipping over ₱499 · Every halal claim is checked by{' '}
                    {name}
                </p>
            </div> */}
            <div className="mx-auto flex h-header max-w-container items-center gap-2 px-gutter md:gap-3 lg:gap-6">
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
                <div className="flex shrink-0 items-center">
                    <span className="hidden lg:block">
                        <ThemeToggle />
                    </span>
                    <Link
                        href="/cart"
                        aria-label="Cart"
                        className="btn btn-icon btn-ghost text-foreground"
                    >
                        <ShoppingCart aria-hidden="true" />
                    </Link>
                    <span className="lg:hidden">
                        <Link
                            href={auth.user ? '/chat' : login().url}
                            aria-label={`Chat${chatUnread > 0 ? `, ${chatUnread} unread` : ''}`}
                            className="btn btn-icon btn-ghost relative text-foreground"
                        >
                            <MessageCircle aria-hidden="true" />
                            {chatUnread > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground"
                                >
                                    {chatUnread > 99 ? '99+' : chatUnread}
                                </span>
                            )}
                        </Link>
                    </span>
                    <span className="hidden items-center gap-1 lg:flex">
                        <Link
                            href={auth.user ? '/notifications' : login().url}
                            aria-label={`Notifications${notifUnread > 0 ? `, ${notifUnread} unread` : ''}`}
                            className="btn btn-icon btn-ghost relative text-foreground"
                        >
                            <Bell aria-hidden="true" />
                            {notifUnread > 0 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground"
                                >
                                    {notifUnread > 99 ? '99+' : notifUnread}
                                </span>
                            )}
                        </Link>
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted"
                        >
                            <NameAvatar
                                name={auth.user?.name ?? 'Guest'}
                                size="sm"
                                label={false}
                            />
                            <span>{auth.user?.name ?? 'Log in'}</span>
                        </Link>
                    </span>
                </div>
            </div>
            {desktopNav && (
                <nav
                    aria-label="Categories"
                    className="border-t border-border lg:h-[var(--nav-h)]"
                >
                    <ul className="mx-auto flex h-full max-w-container items-stretch gap-1 overflow-x-auto px-gutter [scrollbar-width:none] max-lg:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]">
                        {navCategories.map((c) => {
                            const active =
                                activeSlug === c.slug ||
                                (activeSlug?.startsWith(`${c.slug}-`) ??
                                    false);
                            return (
                                <li key={c.id} className="flex">
                                    <Link
                                        href={categoryShow.url(c.slug)}
                                        ref={
                                            active ? activeLinkRef : undefined
                                        }
                                        aria-current={
                                            active ? 'page' : undefined
                                        }
                                        className={navLink(active)}
                                    >
                                        {c.name}
                                    </Link>
                                </li>
                            );
                        })}
                        <li className="ml-auto flex">
                            <a href="#" className={navLink(false)}>
                                Sell on {name}
                            </a>
                            <a href="#" className={navLink(false)}>
                                Help
                            </a>
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    );
}
