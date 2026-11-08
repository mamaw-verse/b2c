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
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

export type AccountNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

export const accountNavItems: AccountNavItem[] = [
    { label: 'Home', href: dashboard().url, icon: Home },
    { label: 'Orders', href: '/account/orders', icon: Package },
    { label: 'Addresses', href: '/account/addresses', icon: MapPin },
    { label: 'Profile', href: editProfile().url, icon: UserRound },
    { label: 'Security', href: editSecurity().url, icon: LockKeyhole },
    { label: 'Appearance', href: editAppearance().url, icon: Palette },
];

export function AccountNavLinks({
    full = false,
    items = accountNavItems,
}: {
    full?: boolean;
    items?: AccountNavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <ul className="grid gap-0.5">
            {items.map((item) => {
                const active = isCurrentUrl(item.href);
                const Icon = item.icon;

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
