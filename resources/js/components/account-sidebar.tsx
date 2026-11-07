import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Home,
    LockKeyhole,
    MapPin,
    Package,
    Palette,
    UserRound,
} from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

export type AccountNavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

export const accountNavItems: AccountNavItem[] = [
    { title: 'Home', href: dashboard().url, icon: Home },
    { title: 'Orders', href: '/account/orders', icon: Package },
    { title: 'Addresses', href: '/account/addresses', icon: MapPin },
    { title: 'Profile', href: editProfile().url, icon: UserRound },
    { title: 'Security', href: editSecurity().url, icon: LockKeyhole },
    { title: 'Appearance', href: editAppearance().url, icon: Palette },
];

export function AccountNavLinks({ full = false }: { full?: boolean }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <ul className="grid gap-0.5">
            {accountNavItems.map((item) => {
                const active = isCurrentUrl(item.href);
                const Icon = item.icon;

                return (
                    <li key={toUrl(item.href)}>
                        <Link
                            href={item.href}
                            title={item.title}
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
                                {item.title}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export function AccountSidebar() {
    return (
        <nav aria-label="Account" className="flex flex-col gap-1">
            <p className="px-3 pt-2 pb-1 text-eyebrow text-muted-foreground uppercase md:hidden lg:block">
                My account
            </p>
            <AccountNavLinks />
        </nav>
    );
}
