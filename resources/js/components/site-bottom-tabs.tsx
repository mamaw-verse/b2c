import { Link, usePage } from '@inertiajs/react';
import { Bell, House, LayoutGrid, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboard, home, login } from '@/routes';
import { show as categoryShow } from '@/routes/categories';

export type TabName = 'Home' | 'Categories' | 'Chat' | 'Notifications' | 'Me';

interface TabItem {
    name: TabName;
    icon: typeof House;
    countKey?: 'chat' | 'notifications';
}

const tabs: TabItem[] = [
    { name: 'Home', icon: House },
    { name: 'Categories', icon: LayoutGrid },
    { name: 'Chat', icon: MessageCircle, countKey: 'chat' },
    { name: 'Notifications', icon: Bell, countKey: 'notifications' },
    { name: 'Me', icon: User },
];

/** Bottom tab bar: phone + tablet storefront navigation. Hidden at lg. */
export function SiteBottomTabs({ active = 'Home' }: { active?: TabName }) {
    const { auth, navCategories, unreadCounts } = usePage().props;

    const hrefFor = (tab: TabName): string => {
        switch (tab) {
            case 'Home':
                return home().url;
            case 'Categories':
                return navCategories[0]
                    ? categoryShow.url(navCategories[0].slug)
                    : '#';
            case 'Chat':
                return auth.user ? '/chat' : login().url;
            case 'Notifications':
                return auth.user ? '/notifications' : login().url;
            case 'Me':
                return (auth.user ? dashboard() : login()).url;
            default:
                return '#';
        }
    };

    return (
        <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 z-header border-t border-border bg-surface pb-safe lg:hidden"
        >
            <ul className="mx-auto flex max-w-xl">
                {tabs.map(({ name, icon: Icon, countKey }) => {
                    const count = countKey
                        ? (unreadCounts?.[countKey] ?? 0)
                        : 0;
                    const hasCount = count > 0;
                    const isActive = name === active;

                    return (
                        <li key={name} className="flex-auto">
                            <Link
                                href={hrefFor(name)}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 px-1 text-caption whitespace-nowrap',
                                    isActive
                                        ? 'font-bold text-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span className="relative">
                                    <Icon
                                        aria-hidden="true"
                                        className={cn(
                                            'size-5',
                                            isActive && 'stroke-[2.5]',
                                        )}
                                    />
                                    {hasCount && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -top-1.5 -right-2.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-caption leading-[1.125rem] text-primary-foreground"
                                        >
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </span>
                                <span>{name}</span>
                                {hasCount && (
                                    <span className="sr-only">
                                        , {count} unread
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
