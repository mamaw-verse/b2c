import { Link } from '@inertiajs/react';
import { Menu, type LucideIcon } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

export type PortalTabItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
    matchPrefix?: string;
};

/** Portal bottom tab bar: phone-only navigation. Shows the given items plus a
    "Menu" tab that opens a drawer with the rest. Hidden at md (sidebar takes
    over on tablet). */
export function PortalBottomTabs({
    items,
    menuItems,
    onMenu,
}: {
    items: PortalTabItem[];
    menuItems: PortalTabItem[];
    onMenu: () => void;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const isActive = (item: PortalTabItem) => {
        const prefix = item.matchPrefix ?? item.href;
        return prefix !== '#' && isCurrentUrl(prefix, undefined, true);
    };
    const menuActive = menuItems.some(isActive);

    return (
        <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 z-header border-t border-border bg-surface pb-safe md:hidden"
        >
            <ul className="mx-auto flex max-w-xl">
                {items.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;

                    return (
                        <li key={item.label} className="flex-auto">
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 px-1 text-caption whitespace-nowrap',
                                    active
                                        ? 'font-bold text-primary-text'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span className="relative">
                                    <Icon
                                        aria-hidden="true"
                                        className={cn(
                                            'size-5',
                                            active && 'stroke-[2.5]',
                                        )}
                                    />
                                    {!!item.badge && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -top-1.5 -right-2.5 grid min-w-4.5 place-items-center rounded-full bg-primary px-1 text-caption leading-[1.125rem] text-primary-foreground"
                                        >
                                            {item.badge > 99
                                                ? '99+'
                                                : item.badge}
                                        </span>
                                    )}
                                </span>
                                <span>{item.label}</span>
                                {!!item.badge && (
                                    <span className="sr-only">
                                        , {item.badge} unread
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
                <li className="flex-auto">
                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={onMenu}
                        className={cn(
                            'relative flex h-14 w-full min-w-touch flex-col items-center justify-center gap-0.5 px-1 text-caption whitespace-nowrap',
                            menuActive
                                ? 'font-bold text-primary-text'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Menu
                            aria-hidden="true"
                            className={cn(
                                'size-5',
                                menuActive && 'stroke-[2.5]',
                            )}
                        />
                        <span>Menu</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}
