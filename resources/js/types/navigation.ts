import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

export type FooterLink = {
    label: string;
    href: string;
};

export type SharedWorkspace = {
    key: 'buyer' | 'seller' | 'admin';
    label: string;
    href: string;
    current: boolean;
};

/** One shop the signed-in user operates. `role` is per shop: owned shops
 * are 'owner', shops they manage as staff are 'staff'. */
export type SellerShop = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    role: 'owner' | 'staff';
    suspended: boolean;
    active: boolean;
    /** Unread seller notifications for this shop. */
    unread_notifications: number;
};

export type WorkspaceEntry = {
    key: 'buyer' | 'seller' | 'admin';
    label: string;
    href: string;
    icon: LucideIcon;
    current: boolean;
    note?: string;
};

export type Marketplace = {
    tagline: string;
    announcement: string | null;
    support: { email: string | null; hours: string | null };
    registration: string | null;
    payments: string[];
    couriers: string[];
    nav: { sell: string | null; help: string | null };
    claims: { halal_verification: boolean };
    trust: { certificates: boolean; cold_chain: boolean; cod: boolean };
    socials: { label: string; icon: string; href: string }[];
    footer: Record<
        'shop' | 'support' | 'trust' | 'sell' | 'company',
        FooterLink[]
    >;
};
