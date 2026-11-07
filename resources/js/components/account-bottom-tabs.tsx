import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { accountNavItems } from '@/components/account-sidebar';

export function AccountBottomTabs() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 z-header border-t border-border bg-surface pb-safe lg:hidden"
        >
            <ul className="mx-auto flex max-w-xl">
                {accountNavItems.map((item) => {
                    const active = isCurrentUrl(item.href);
                    const Icon = item.icon;

                    return (
                        <li key={item.title} className="flex-auto">
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 px-1 text-caption whitespace-nowrap',
                                    active
                                        ? 'font-bold text-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'icon',
                                        active && 'stroke-[2.5]',
                                    )}
                                    aria-hidden="true"
                                />
                                <span>{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
