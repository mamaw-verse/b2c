import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import {
    flatNav,
    navGroups,
    navItemActive,
    type WorkspaceNavItem,
} from '@/lib/workspaces';
import { cn } from '@/lib/utils';

export function AccountNavLinks({
    full = false,
    items = flatNav('buyer'),
    badges = {},
}: {
    full?: boolean;
    items?: WorkspaceNavItem[];
    badges?: Partial<Record<string, number>>;
}) {
    const { currentUrl } = useCurrentUrl();

    return (
        <ul className="grid gap-0.5">
            {items.map((item) => {
                const active = navItemActive(item, currentUrl);
                const Icon = item.icon;
                const badge = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

                return (
                    <li key={item.label}>
                        <Link
                            href={item.href}
                            title={item.label}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label',
                                full
                                    ? 'justify-start'
                                    : 'md:justify-center lg:justify-start',
                                active
                                    ? 'bg-primary-soft text-primary-soft-foreground'
                                    : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                            )}
                        >
                            <Icon className="icon" aria-hidden="true" />
                            <span
                                className={cn(
                                    'flex-1',
                                    !full && 'md:sr-only lg:not-sr-only',
                                )}
                            >
                                {item.label}
                            </span>
                            {badge > 0 && (
                                <span
                                    className={cn(
                                        'badge badge-solid',
                                        !full && 'hidden lg:inline-flex',
                                    )}
                                >
                                    {badge}
                                </span>
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export function AccountSidebar({
    badges = {},
}: {
    badges?: Partial<Record<string, number>>;
}) {
    return (
        <nav aria-label="Account" className="flex flex-col gap-1">
            {navGroups('buyer').map((group) => (
                <div key={group.label}>
                    {group.label && (
                        <p className="px-3 pt-2 pb-1 text-eyebrow text-muted-foreground uppercase md:hidden lg:block">
                            {group.label}
                        </p>
                    )}
                    <AccountNavLinks items={group.items} badges={badges} />
                </div>
            ))}
        </nav>
    );
}
