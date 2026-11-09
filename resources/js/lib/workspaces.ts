import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    Boxes,
    Flag,
    FolderTree,
    Gauge,
    Home,
    Inbox,
    LockKeyhole,
    MapPin,
    MessageCircle,
    Package,
    Palette,
    Percent,
    ScrollText,
    Settings,
    ShoppingBag,
    Ticket,
    UserRound,
    Users,
    Wallet,
} from 'lucide-react';
import { home as accountHome } from '@/routes/account';
import { index as addresses } from '@/routes/addresses';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminAuditLog } from '@/routes/admin/audit-log';
import { index as adminCategories } from '@/routes/admin/categories';
import { index as adminPayouts } from '@/routes/admin/payouts';
import { edit as adminSettings } from '@/routes/admin/settings';
import { index as adminUsers } from '@/routes/admin/users';
import { index as adminVouchers } from '@/routes/admin/vouchers';
import { edit as editAppearance } from '@/routes/appearance';
import { index as chat } from '@/routes/chat';
import { index as notifications } from '@/routes/notifications';
import { index as orders } from '@/routes/orders';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { dashboard as sellerDashboard } from '@/routes/seller';
import { index as sellerChat } from '@/routes/seller/chat';
import { index as sellerCustomers } from '@/routes/seller/customers';
import { index as sellerFinance } from '@/routes/seller/finance';
import { index as sellerOrders } from '@/routes/seller/orders';
import { index as sellerProducts } from '@/routes/seller/products';
import { edit as sellerSettings } from '@/routes/seller/settings';
import { index as sellerVouchers } from '@/routes/seller/vouchers';

export type WorkspaceKey = 'buyer' | 'seller' | 'admin';

/** Sections that are planned but not built yet stay in this map behind a
 * flag; nav items referencing a disabled feature are filtered out of
 * `navGroups` so no placeholder links ever render. */
export const workspaceFeatures = {
    'seller.marketing': true,
    'seller.finance': true,
    'admin.users': true,
    'admin.audit-log': true,
    'admin.settings': true,
} as const;

export type WorkspaceFeature = keyof typeof workspaceFeatures;

export type WorkspaceNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    /** URL prefix that marks the item active; falls back to `href`. */
    matchPrefix?: string;
    /** Match the href exactly instead of by prefix (e.g. workspace homes). */
    exact?: boolean;
    /** Feature flag gating the item until its section exists. */
    feature?: WorkspaceFeature;
    /** Slot layouts fill with a live count (orders, chats, queue). */
    badgeKey?: 'orders' | 'chat' | 'queue';
};

export type WorkspaceNavGroup = {
    label?: string;
    items: WorkspaceNavItem[];
};

export type WorkspaceConfig = {
    key: WorkspaceKey;
    /** Name shown in the workspace header. */
    label: string;
    home: string;
    nav: WorkspaceNavGroup[];
};

/** Profile settings stay reachable from every workspace's user menu, so
 * this group is shared by the buyer shell and the admin's unified menu. */
const accountSettingsNavGroup: WorkspaceNavGroup = {
    label: 'Account',
    items: [
        {
            label: 'Profile',
            href: editProfile().url,
            icon: UserRound,
            matchPrefix: '/settings/profile',
        },
        {
            label: 'Security',
            href: editSecurity().url,
            icon: LockKeyhole,
            matchPrefix: '/settings/security',
        },
        {
            label: 'Appearance',
            href: editAppearance().url,
            icon: Palette,
            matchPrefix: '/settings/appearance',
        },
    ],
};

const shoppingNavGroup: WorkspaceNavGroup = {
    label: 'Shopping',
    items: [
        {
            label: 'Account home',
            href: accountHome().url,
            icon: Home,
            exact: true,
        },
        {
            label: 'My purchases',
            href: orders().url,
            icon: Package,
            matchPrefix: '/account/orders',
        },
        {
            label: 'Addresses',
            href: addresses().url,
            icon: MapPin,
            matchPrefix: '/account/addresses',
        },
        {
            label: 'Chats',
            href: chat().url,
            icon: MessageCircle,
            matchPrefix: '/account/chat',
            badgeKey: 'chat',
        },
        {
            label: 'Notifications',
            href: notifications().url,
            icon: Bell,
            matchPrefix: '/account/notifications',
        },
    ],
};

export const workspaces: Record<WorkspaceKey, WorkspaceConfig> = {
    buyer: {
        key: 'buyer',
        label: 'My account',
        home: accountHome().url,
        nav: [shoppingNavGroup, accountSettingsNavGroup],
    },
    seller: {
        key: 'seller',
        label: 'Seller Centre',
        home: sellerDashboard().url,
        nav: [
            {
                items: [
                    {
                        label: 'Dashboard',
                        href: sellerDashboard().url,
                        icon: Gauge,
                        matchPrefix: '/seller/dashboard',
                    },
                    {
                        label: 'Orders',
                        href: sellerOrders().url,
                        icon: ShoppingBag,
                        matchPrefix: '/seller/orders',
                        badgeKey: 'orders',
                    },
                    {
                        label: 'Products',
                        href: sellerProducts().url,
                        icon: Boxes,
                        matchPrefix: '/seller/products',
                    },
                    {
                        label: 'Chats',
                        href: sellerChat().url,
                        icon: MessageCircle,
                        matchPrefix: '/seller/chat',
                        badgeKey: 'chat',
                    },
                    {
                        label: 'Customers',
                        href: sellerCustomers().url,
                        icon: Users,
                        matchPrefix: '/seller/customers',
                    },
                    {
                        label: 'Marketing',
                        href: sellerVouchers().url,
                        icon: Percent,
                        matchPrefix: '/seller/vouchers',
                        feature: 'seller.marketing',
                    },
                    {
                        label: 'Finance',
                        href: sellerFinance().url,
                        icon: Wallet,
                        matchPrefix: '/seller/finance',
                        feature: 'seller.finance',
                    },
                    {
                        label: 'Shop settings',
                        href: sellerSettings().url,
                        icon: Settings,
                        matchPrefix: '/seller/settings',
                    },
                ],
            },
        ],
    },
    admin: {
        key: 'admin',
        label: 'Admin',
        home: adminDashboard().url,
        nav: [
            {
                items: [
                    {
                        label: 'Dashboard',
                        href: adminDashboard().url,
                        icon: Gauge,
                        matchPrefix: '/admin/dashboard',
                    },
                    {
                        label: 'Moderation',
                        href: '/admin/moderation',
                        icon: Inbox,
                        matchPrefix: '/admin/moderation',
                        badgeKey: 'queue',
                    },
                    {
                        label: 'Reports',
                        href: '/admin/moderation?type=report',
                        icon: Flag,
                    },
                    {
                        label: 'Categories',
                        href: adminCategories().url,
                        icon: FolderTree,
                        matchPrefix: '/admin/categories',
                    },
                    {
                        label: 'Vouchers',
                        href: adminVouchers().url,
                        icon: Ticket,
                        matchPrefix: '/admin/vouchers',
                    },
                    {
                        label: 'Payouts',
                        href: adminPayouts().url,
                        icon: Wallet,
                        matchPrefix: '/admin/payouts',
                    },
                    {
                        label: 'Users',
                        href: adminUsers().url,
                        icon: Users,
                        matchPrefix: '/admin/users',
                        feature: 'admin.users',
                    },
                    {
                        label: 'Audit log',
                        href: adminAuditLog().url,
                        icon: ScrollText,
                        matchPrefix: '/admin/audit-log',
                        feature: 'admin.audit-log',
                    },
                    {
                        label: 'Settings',
                        href: adminSettings().url,
                        icon: Settings,
                        matchPrefix: '/admin/settings',
                        feature: 'admin.settings',
                    },
                ],
            },
            // Admins get a single unified shell: the menu only adds the
            // profile settings entries — all other buyer/seller surfaces
            // are stripped.
            accountSettingsNavGroup,
        ],
    },
};

/** Nav groups with items hidden behind disabled feature flags removed. */
export function navGroups(workspace: WorkspaceKey): WorkspaceNavGroup[] {
    return workspaces[workspace].nav
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    item.feature === undefined ||
                    workspaceFeatures[item.feature],
            ),
        }))
        .filter((group) => group.items.length > 0);
}

export function flatNav(workspace: WorkspaceKey): WorkspaceNavItem[] {
    return navGroups(workspace).flatMap((group) => group.items);
}

export function navItemActive(
    item: WorkspaceNavItem,
    currentPath: string,
): boolean {
    if (item.exact) {
        return currentPath === item.href;
    }

    return currentPath.startsWith(item.matchPrefix ?? item.href);
}
