import { router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Store, UsersRound } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { update as updateActiveShop } from '@/routes/seller/active-shop';
import type { SellerShop } from '@/types/navigation';

/** Role chip: owned shops read "Owner", managed shops read "Staff". Colour
 * is never the only signal — the label is always rendered. */
function RoleBadge({
    role,
    className,
}: {
    role: 'owner' | 'staff';
    className?: string;
}) {
    return (
        <span
            className={cn(
                'badge shrink-0',
                role === 'owner' ? 'badge-success' : 'badge-neutral',
                className,
            )}
        >
            {role === 'owner' ? 'Owner' : 'Staff'}
        </span>
    );
}

function ShopIcon({ role }: { role: 'owner' | 'staff' }) {
    const Icon = role === 'owner' ? Store : UsersRound;

    return <Icon aria-hidden="true" className="size-4 shrink-0" />;
}

/**
 * Persistent shop switcher for the Seller Centre header. Owned shops are
 * grouped under "My shops" and managed shops under "Managed shops", each
 * with a role badge, and the active shop is always named in the header.
 * Switching is a server round-trip: the server validates membership,
 * stores the active shop and redirects to that shop's home.
 */
export function ShopSwitcher() {
    const { seller } = usePage<{
        seller?: {
            role?: 'owner' | 'staff';
            shop_name: string;
            shops?: SellerShop[];
        } | null;
    }>().props;
    const [switching, setSwitching] = useState(false);

    if (!seller) {
        return null;
    }

    const shops: SellerShop[] = seller.shops ?? [];
    const role = seller.role ?? 'staff';
    // Unread alerts in shops the user is not currently looking at.
    const othersUnread = shops
        .filter((shop) => !shop.active)
        .reduce((total, shop) => total + shop.unread_notifications, 0);
    const owned = shops.filter((shop) => shop.role === 'owner');
    const managed = shops.filter((shop) => shop.role === 'staff');

    const trigger = (
        <>
            <ShopIcon role={role} />
            <span className="max-w-28 truncate sm:max-w-48">
                {seller.shop_name}
            </span>
            <RoleBadge role={role} className="max-sm:hidden" />
        </>
    );

    // One shop: nothing to switch, but the header still names the shop
    // and the role the user holds in it.
    if (shops.length <= 1) {
        return (
            <div
                className="flex min-h-touch items-center gap-2 px-2 text-label"
                aria-label={`Active shop: ${seller.shop_name} (${role})`}
            >
                {trigger}
            </div>
        );
    }

    function switchTo(shop: SellerShop) {
        if (shop.active || switching) {
            return;
        }

        router.put(
            updateActiveShop().url,
            { shop_id: shop.id },
            {
                onStart: () => setSwitching(true),
                onFinish: () => setSwitching(false),
            },
        );
    }

    function renderGroup(label: string, items: SellerShop[]) {
        if (items.length === 0) {
            return null;
        }

        return (
            <DropdownMenuGroup>
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                {items.map((shop) => (
                    <DropdownMenuItem
                        key={shop.id}
                        disabled={switching}
                        onSelect={() => switchTo(shop)}
                        aria-current={shop.active ? 'true' : undefined}
                    >
                        <ShopIcon role={shop.role} />
                        <span className="min-w-0 flex-1 truncate">
                            {shop.name}
                            {shop.suspended && (
                                <span className="block text-caption text-danger-text">
                                    Suspended
                                </span>
                            )}
                        </span>
                        <RoleBadge role={shop.role} />
                        {!shop.active && shop.unread_notifications > 0 && (
                            <span className="badge shrink-0">
                                {shop.unread_notifications} new
                            </span>
                        )}
                        {shop.active && (
                            <Check aria-hidden="true" className="size-4" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={`Switch shop. Active: ${seller.shop_name} (${role}).${
                    othersUnread > 0
                        ? ` ${othersUnread} unread notifications in other shops.`
                        : ''
                }`}
                className="flex min-h-touch items-center gap-2 rounded-button border border-border px-2 text-label hover:bg-surface-muted"
            >
                {trigger}
                {othersUnread > 0 && (
                    <span className="badge shrink-0" aria-hidden="true">
                        {othersUnread > 99 ? '99+' : othersUnread}
                    </span>
                )}
                <ChevronsUpDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-64">
                {renderGroup('My shops', owned)}
                {owned.length > 0 && managed.length > 0 && (
                    <DropdownMenuSeparator />
                )}
                {renderGroup('Managed shops', managed)}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
